
"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { useAuth } from "@/hooks/use-auth";


function LoginPageContent() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const searchParams = useSearchParams();
  const isCompletingProfile = searchParams.get('complete_profile') === 'true';
  const { user } = useAuth();

  const finalAuthMode = isCompletingProfile ? "signup" : authMode;

  const getTitle = () => {
    if (isCompletingProfile) return 'Complete seu Cadastro';
    return finalAuthMode === 'login' ? 'Bem-vindo ao Várzea Champions' : 'Crie uma Conta';
  }

  const getDescription = () => {
    if (isCompletingProfile) return 'Falta pouco! Preencha os dados abaixo para finalizar.';
    return finalAuthMode === 'login' ? 'Faça login na sua conta para continuar.' : 'Insira seus dados abaixo para começar.';
  }

  return (
     <div className="flex items-center justify-center h-full p-4 sm:p-6 lg:p-8">
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
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
