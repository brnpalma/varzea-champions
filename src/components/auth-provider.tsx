
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
}

export interface User extends FirebaseAuthUser, UserProfile {}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let profileUnsubscribe: Unsubscribe | undefined;
    let groupUnsubscribe: Unsubscribe | undefined;

    const cleanupListeners = () => {
      if (profileUnsubscribe) profileUnsubscribe();
      if (groupUnsubscribe) groupUnsubscribe();
      profileUnsubscribe = undefined;
      groupUnsubscribe = undefined;
    };

    const listenToGroupData = (groupId: string, currentUser: User) => {
        if (groupUnsubscribe) groupUnsubscribe(); // Clean up previous listener
        
        const groupDocRef = doc(firestore, "groups", groupId);
        groupUnsubscribe = onSnapshot(groupDocRef, (groupDocSnap) => {
            const groupName = groupDocSnap.exists() ? groupDocSnap.data().name || null : null;
            setUser((prevUser) => {
                if (prevUser && prevUser.uid === currentUser.uid) {
                    return { ...prevUser, groupName };
                }
                return prevUser;
            });
        });
    };

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      cleanupListeners();

      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        profileUnsubscribe = onSnapshot(userDocRef, async (snap) => {
          if (groupUnsubscribe) groupUnsubscribe();

          if (snap.exists()) {
            const userProfileData = snap.data() as Omit<UserProfile, 'groupName'>; // groupName will be handled separately
            
            const currentUser = {
              ...firebaseUser,
              displayName: userProfileData.displayName || firebaseUser.displayName || "Usuário",
              photoURL: userProfileData.photoURL || firebaseUser.photoURL || null,
              userType: userProfileData.userType,
              playerSubscriptionType: userProfileData.playerSubscriptionType,
              groupId: userProfileData.groupId || null,
              rating: userProfileData.rating || null,
              groupName: user?.groupName || null, // a temp value before the group listener updates it
            };
            setUser(currentUser as User);

            if (currentUser.groupId) {
                listenToGroupData(currentUser.groupId, currentUser as User);
            } else {
                 setUser(prev => prev ? {...prev, groupName: null} : null);
            }

          } else {
             setUser({
              ...firebaseUser,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              userType: undefined as any, 
              groupName: null,
              playerSubscriptionType: undefined as any,
              groupId: null,
              rating: null
            } as User);
          }
           setLoading(false);
        }, (error) => {
            console.error("Snapshot listener error:", error);
            setUser(null);
            setLoading(false);
        });

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      cleanupListeners();
    };
  }, [user?.groupName]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === "/login";
    const isCompletingProfile = searchParams.get('complete_profile') === 'true';
    
    if (user && !user.userType && !isCompletingProfile) {
       router.push("/login?complete_profile=true");
       return;
    }
    
    if (user && user.userType && isAuthPage) {
      router.push("/");
    }
    
  }, [user, loading, pathname, router, searchParams]);


  if (loading) {
     return (
      <div className="flex items-center justify-center h-screen bg-background">
        <FootballSpinner />
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
