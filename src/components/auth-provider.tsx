
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
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // User document exists, they are a returning user.
          // Set up the profile listener.
          profileUnsubscribe = onSnapshot(userDocRef, async (snap) => {
            const userProfileData = snap.data() as UserProfile;
            
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
          // User document does not exist. This is a new user (e.g., via Google Sign-In).
          // Set a minimal user object and let the UI handle profile completion.
          setUser({
            ...firebaseUser,
            displayName: firebaseUser.displayName || "Usuário",
            photoURL: firebaseUser.photoURL,
            userType: UserType.JOGADOR,
            groupName: null,
            playerSubscriptionType: PlayerSubscriptionType.AVULSO,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === "/login";
    const isCompletingProfile = searchParams.get('complete_profile') === 'true';

    // If user is logged in, but their profile is not complete, redirect to completion page.
    if (user && !user.userType && !isAuthPage) {
       router.push("/login?complete_profile=true");
       return;
    }

    if (user && user.userType && isAuthPage) {
      if (!isCompletingProfile) {
        router.push("/");
      }
    }
    
    if (user && !user.groupId && pathname.startsWith('/login') && searchParams.get('group_id')) {
        // This case handles a user who logged in via google and is now joining a group
        // It redirects them to the signup form to confirm their details and join the group
        const params = new URLSearchParams(searchParams);
        params.set('complete_profile', 'true');
        router.push(`/login?${params.toString()}`);
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
