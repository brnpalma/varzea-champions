"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export enum UserType {
  JOGADOR = "Jogador",
  GESTOR_GRUPO = "Gestor do Grupo",
  GESTOR_QUADRA = "Gestor da Quadra",
}

export interface UserProfile {
  displayName: string;
  photoURL: string;
  userType: UserType;
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

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseAuthUser) => {
    const userDocRef = doc(firestore, "users", firebaseUser.uid);
    
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userProfileData = docSnap.data() as UserProfile;
        setUser({
          ...firebaseUser,
          ...userProfileData,
          displayName: userProfileData.displayName || firebaseUser.displayName || "Usuário",
          photoURL: userProfileData.photoURL || firebaseUser.photoURL || "",
        });
      } else {
        // If profile doesn't exist, use basic auth info
        setUser({
          ...firebaseUser,
          displayName: firebaseUser.displayName || "Usuário",
          photoURL: firebaseUser.photoURL || "",
          userType: UserType.JOGADOR, // Default value
        });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        const unsubscribeProfile = await fetchUserProfile(firebaseUser);
        // Store the profile unsubscribe function to call it on cleanup
        (auth as any)._unsubscribeProfile = unsubscribeProfile;
      } else {
        setUser(null);
        setLoading(false);
        // Clean up profile listener if it exists
        if ((auth as any)._unsubscribeProfile) {
          (auth as any)._unsubscribeProfile();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if ((auth as any)._unsubscribeProfile) {
        (auth as any)._unsubscribeProfile();
      }
    };
  }, [fetchUserProfile]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === "/login" || pathname === "/signup";

    if (user && isAuthPage) {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-full max-w-sm p-8 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (user && isAuthPage) {
    return null; // Render nothing while redirecting
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}