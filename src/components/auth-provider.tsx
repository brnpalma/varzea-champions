
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { doc, getDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase";
import { FootballSpinner } from "./ui/football-spinner";

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
  allowConfirmationWithDebt?: boolean;
  totalGoals?: number;
}

export interface User extends FirebaseAuthUser, UserProfile {}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  groupSettings: GroupSettings | null;
}

export interface GroupSettings {
    name?: string;
    playersPerTeam?: number;
    gameDays?: Record<string, any>;
    valorMensalidade?: number;
    valorAvulso?: number;
    chavePix?: string;
}


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [groupSettings, setGroupSettings] = useState<GroupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let profileUnsubscribe: Unsubscribe | undefined;
    let groupUnsubscribe: Unsubscribe | undefined;

    const cleanupListeners = () => {
      if (profileUnsubscribe) profileUnsubscribe();
      if (groupUnsubscribe) groupUnsubscribe();
    };

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      cleanupListeners();
      setLoading(true);

      if (firebaseUser) {
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
            allowConfirmationWithDebt: userProfileData?.allowConfirmationWithDebt || false,
            totalGoals: userProfileData?.totalGoals || 0,
            groupName: null,
          } as User;

          setUser(currentUser);
          
          if (currentUser.groupId) {
            const groupDocRef = doc(firestore, "groups", currentUser.groupId);
            groupUnsubscribe = onSnapshot(groupDocRef, (groupDoc) => {
              const groupData = groupDoc.exists() ? groupDoc.data() as GroupSettings : null;
              setGroupSettings(groupData);
              setUser(prevUser => prevUser ? { ...prevUser, groupName: groupData?.name || null } : null);
              setLoading(false);
            }, () => setLoading(false));
          } else {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
