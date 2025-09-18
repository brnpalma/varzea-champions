
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
import { useAuth } from "@/hooks/use-auth";

function LoginPageContent() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const isCompletingProfile = searchParams.get('complete_profile') === 'true';
  const groupId = searchParams.get('group_id');

  useEffect(() => {
    // If auth state is loaded, a user exists, AND they are not trying to complete their profile,
    // then they shouldn't be on the login page.
    if (!loading && user && !isCompletingProfile) {
      router.push('/inicio');
    }
  }, [user, loading, router, isCompletingProfile]);

  const finalAuthMode = isCompletingProfile ? "signup" : authMode;

  const getTitle = () => {
    if (isCompletingProfile) return 'Complete seu Cadastro';
    return finalAuthMode === 'login' ? 'Bem-vindo ao Várzea Champions' : 'Crie uma Conta';
  }

  const getDescription = () => {
    if (isCompletingProfile) return 'Falta pouco! Preencha os dados abaixo para finalizar.';
    if (groupId) {
      return 'Você foi convidado para um grupo. Crie sua conta ou faça login para aceitar o convite.';
    }
    return finalAuthMode === 'login' ? 'Faça login na sua conta para continuar.' : 'Insira seus dados abaixo para começar.';
  }

  // Show a spinner while loading auth state, or if a logged-in user (who doesn't need to complete profile) is about to be redirected.
  if (loading || (user && !isCompletingProfile)) {
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
