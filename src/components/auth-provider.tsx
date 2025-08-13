
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const [initialLoad, setInitialLoad] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }

      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        profileUnsubscribe = onSnapshot(userDocRef, async (userDocSnap) => {
          if (userDocSnap.exists()) {
            const userProfileData = userDocSnap.data() as UserProfile;
            
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
              userType: userProfileData.userType || UserType.JOGADOR,
              groupName: groupName,
              playerSubscriptionType: userProfileData.playerSubscriptionType || PlayerSubscriptionType.AVULSO,
              groupId: userProfileData.groupId || null,
            });
          } else {
            setUser({
              ...firebaseUser,
              displayName: firebaseUser.displayName || "Usuário",
              photoURL: firebaseUser.photoURL || null,
              userType: UserType.JOGADOR,
              groupName: null,
              playerSubscriptionType: PlayerSubscriptionType.AVULSO,
              groupId: null,
            });
          }
          if (!initialLoad) {
            setLoading(false);
            setInitialLoad(true);
          }
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUser(null);
          if (!initialLoad) {
            setLoading(false);
            setInitialLoad(true);
          }
        });
      } else {
        setUser(null);
         if (!initialLoad) {
            setLoading(false);
            setInitialLoad(true);
        }
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialLoad) return;

    if (pathname !== "/") {
      router.push("/");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoad]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === "/login" || pathname.startsWith("/signup");

    if (user && isAuthPage) {
      router.push("/");
    }

  }, [user, loading, pathname, router]);


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
