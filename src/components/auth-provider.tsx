
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { doc, getDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase";
import { FootballSpinner } from "./ui/football-spinner";
import defaultGroupSettings from '@/config/group-settings.json';


export enum UserType {
  JOGADOR = "Jogador",
  GESTOR_GRUPO = "Gestor do Grupo",
  GESTOR_QUADRA = "Gestor da Quadra",
}

export enum PlayerSubscriptionType {
    MENSAL = "Mensal",
    AVULSO = "Avulso",
}

export interface UserProfile {
  displayName: string | null;
  photoURL: string | null;
  userType: UserType;
  groupName: string | null;
  playerSubscriptionType: PlayerSubscriptionType;
  groupId: string | null;
  rating: number | null;
  totalGoals?: number;
  lavouColete?: boolean;
  isSubscriber?: boolean;
}

export interface User extends FirebaseAuthUser, UserProfile {}

export interface GroupSettings {
    name?: string;
    playersPerTeam?: number;
    gameDays?: Record<string, any>;
    valorMensalidade?: number;
    valorAvulso?: number;
    chavePix?: string;
    allowConfirmationWithDebt?: boolean;
    enableEquipmentManager?: boolean;
    createdAt?: string;
}

export interface Subscription {
  dataInicio: {
    seconds: number;
    nanoseconds: number;
  };
}


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  groupSettings: GroupSettings | null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [groupSettings, setGroupSettings] = useState<GroupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Persist group_id from invite link across Google Auth redirects
    const groupIdFromUrl = searchParams.get('group_id');
    if (groupIdFromUrl) {
      sessionStorage.setItem('invite_group_id', groupIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    let profileUnsubscribe: Unsubscribe | undefined;
    let groupUnsubscribe: Unsubscribe | undefined;

    const cleanupListeners = () => {
      if (profileUnsubscribe) profileUnsubscribe();
      if (groupUnsubscribe) groupUnsubscribe();
    };

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      cleanupListeners();
      setLoading(true);

      if (firebaseUser) {
        // Fetch subscription status
        let isSubscriber = false;
        if (firebaseUser.email) {
          const subscriptionDocRef = doc(firestore, "assinaturas", firebaseUser.email);
          const subscriptionDoc = await getDoc(subscriptionDocRef);
          if (subscriptionDoc.exists()) {
            const subscriptionData = subscriptionDoc.data() as Subscription;
            const startDate = new Date(subscriptionData.dataInicio.seconds * 1000);
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            if (startDate > oneYearAgo) {
              isSubscriber = true;
            }
          }
        }

        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        profileUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
          if (groupUnsubscribe) groupUnsubscribe();

          const userProfileData = userDoc.exists() ? userDoc.data() as UserProfile : null;
          
          if (!userProfileData && pathname !== "/login") {
             router.push("/login?complete_profile=true");
             setLoading(false);
             return;
          }

          const currentUser = {
            ...firebaseUser,
            displayName: userProfileData?.displayName || firebaseUser.displayName,
            photoURL: userProfileData?.photoURL || firebaseUser.photoURL,
            userType: userProfileData?.userType,
            playerSubscriptionType: userProfileData?.playerSubscriptionType,
            groupId: userProfileData?.groupId || null,
            rating: userProfileData?.rating || 1,
            totalGoals: userProfileData?.totalGoals || 0,
            lavouColete: userProfileData?.lavouColete || false,
            groupName: null,
            isSubscriber: isSubscriber,
          } as User;
          
          if (currentUser.groupId) {
            // Load default settings from JSON instantly for better UX
            setGroupSettings(defaultGroupSettings);
            
            const groupDocRef = doc(firestore, "groups", currentUser.groupId);
            groupUnsubscribe = onSnapshot(groupDocRef, (groupDoc) => {
              const groupData = groupDoc.exists() ? groupDoc.data() as GroupSettings : null;
              setUser({ ...currentUser, groupName: groupData?.name || null });
              // Overwrite with fresh data from Firestore
              setGroupSettings(groupData);
              setLoading(false);
            }, (error) => {
              console.error('Error fetching group document for user:', currentUser.uid, 'groupId:', currentUser.groupId, error);
              // If there's an error fetching the group, proceed without group data
              setUser(currentUser);
              setGroupSettings(null);
              setLoading(false)
            });
          } else {
            setUser(currentUser);
            setGroupSettings(null);
            setLoading(false);
          }
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUser(null);
          setLoading(false);
        });

      } else {
        setUser(null);
        setGroupSettings(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      cleanupListeners();
    };
  }, [pathname, router]);


  if (loading) {
     return (
      <div className="flex items-center justify-center h-screen bg-background">
        <FootballSpinner />
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading, groupSettings }}>
      {children}
    </AuthContext.Provider>
  );
}
