
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
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }

      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          profileUnsubscribe = onSnapshot(userDocRef, async (snap) => {
            const userProfileData = snap.data() as UserProfile | undefined;
            
            if (!userProfileData) {
              // User document was deleted, treat as logged out or new user
              setUser({
                ...firebaseUser,
                displayName: firebaseUser.displayName || "Usuário",
                photoURL: firebaseUser.photoURL,
                userType: UserType.JOGADOR, // Fallback value
                groupName: null,
                playerSubscriptionType: PlayerSubscriptionType.AVULSO, // Fallback value
                groupId: null,
              });
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
              userType: userProfileData.userType || UserType.JOGADOR,
              groupName: groupName,
              playerSubscriptionType: userProfileData.playerSubscriptionType || PlayerSubscriptionType.AVULSO,
              groupId: userProfileData.groupId || null,
            });
            setLoading(false);
          });
        } else {
          setUser({
            ...firebaseUser,
            displayName: firebaseUser.displayName || "Usuário",
            photoURL: firebaseUser.photoURL,
            userType: UserType.JOGADOR, // Fallback, will be updated on profile completion
            groupName: null,
            playerSubscriptionType: PlayerSubscriptionType.AVULSO, // Fallback
            groupId: null,
          });
          setLoading(false);
        }
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
    
    if (initialLoad) {
      router.push('/');
      setInitialLoad(false);
      return;
    }

    const isAuthPage = pathname === "/login";
    const isCompletingProfile = searchParams.get('complete_profile') === 'true';

    // If user exists in auth, but not in Firestore (no userType), force profile completion.
    if (user && !user.userType && !isAuthPage) {
       router.push("/login?complete_profile=true");
       return;
    }
    
    if (user && user.userType && isAuthPage) {
      // If a complete user is on the login page, redirect them away, unless they are there to complete profile.
      if (!isCompletingProfile) {
        router.push("/");
      }
    }
    
    // This handles a user who logged in via Google and is now joining a group
    if (user && !user.groupId && pathname.startsWith('/login') && searchParams.get('group_id')) {
        const params = new URLSearchParams(searchParams);
        params.set('complete_profile', 'true');
        router.push(`/login?${params.toString()}`);
    }

  }, [user, loading, pathname, router, searchParams, initialLoad]);


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
