
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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
    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }

      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        profileUnsubscribe = onSnapshot(userDocRef, async (snap) => {
          if (snap.exists()) {
            const userProfileData = snap.data() as UserProfile | undefined;
            
            if (!userProfileData) {
               setUser(null);
               setLoading(false);
               return;
            }

            let groupName = null;
            if (userProfileData.groupId) {
              const groupDocRef = doc(firestore, "groups", userProfileData.groupId);
              const groupDocSnap = await getDoc(groupDocRef);
              if (groupDocSnap.exists()) {
                groupName = groupDocSnap.data().name || null;
              }
            }

            setUser({
              ...firebaseUser,
              displayName: userProfileData.displayName || firebaseUser.displayName || "Usuário",
              photoURL: userProfileData.photoURL || firebaseUser.photoURL || null,
              userType: userProfileData.userType,
              groupName: groupName,
              playerSubscriptionType: userProfileData.playerSubscriptionType,
              groupId: userProfileData.groupId || null,
            });

          } else {
             setUser({
              ...firebaseUser,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              userType: undefined as any, 
              groupName: null,
              playerSubscriptionType: undefined as any,
              groupId: null,
            });
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
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === "/login";
    const isCompletingProfile = searchParams.get('complete_profile') === 'true';
    
    if (user && !user.userType && !isCompletingProfile) {
       router.push("/login?complete_profile=true");
       return;
    }
    
    if (user && user.userType && isAuthPage && !isCompletingProfile) {
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
