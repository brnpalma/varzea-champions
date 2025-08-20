
"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { AuthToggle } from "@/components/auth-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FootballSpinner } from "@/components/ui/football-spinner";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";

function LoginPageContent() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [groupName, setGroupName] = useState<string | null>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const isCompletingProfile = searchParams.get('complete_profile') === 'true';
  const groupId = searchParams.get('group_id');

  useEffect(() => {
    // If the auth state is loaded and a user exists, they shouldn't be on the login page.
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);


  useEffect(() => {
    const fetchGroupName = async () => {
      if (groupId) {
        setIsLoadingGroup(true);
        try {
          const groupDocRef = doc(firestore, "groups", groupId);
          const groupDocSnap = await getDoc(groupDocRef);
          if (groupDocSnap.exists()) {
            setGroupName(groupDocSnap.data().name);
          }
        } catch (error) {
          console.error("Error fetching group name: ", error);
        } finally {
          setIsLoadingGroup(false);
        }
      }
    };
    fetchGroupName();
  }, [groupId]);

  const finalAuthMode = isCompletingProfile ? "signup" : authMode;

  const getTitle = () => {
    if (isCompletingProfile) return 'Complete seu Cadastro';
    return finalAuthMode === 'login' ? 'Bem-vindo ao Várzea Champions' : 'Crie uma Conta';
  }

  const getDescription = () => {
    if (isCompletingProfile) return 'Falta pouco! Preencha os dados abaixo para finalizar.';
    if (groupId) {
      if (isLoadingGroup) return 'Carregando informações do grupo...';
      if (groupName) return `Você está sendo convidado para o grupo ${groupName}.`;
      return 'Crie sua conta para aceitar o convite.';
    }
    return finalAuthMode === 'login' ? 'Faça login na sua conta para continuar.' : 'Insira seus dados abaixo para começar.';
  }

  // If we are still loading the auth state, or if we are about to redirect, show a spinner.
  if (loading || user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FootballSpinner />
      </div>
    );
  }

  return (
     <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
             {getTitle()}
          </CardTitle>
          <CardDescription>
             {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isCompletingProfile && (
            <AuthToggle authMode={finalAuthMode} setAuthMode={setAuthMode} />
          )}
          {finalAuthMode === "login" ? <LoginForm /> : <SignupForm />}
        </CardContent>
      </Card>
    </div>
  )
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><FootballSpinner /></div>}>
      <LoginPageContent />
    </Suspense>
  )
}
