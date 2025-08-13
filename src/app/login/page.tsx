
"use client";

import { useState } from "react";
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

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
             {authMode === 'login' ? 'Bem-vindo ao Várzea Champions' : 'Crie uma Conta'}
          </CardTitle>
          <CardDescription>
             {authMode === 'login' ? 'Faça login na sua conta para continuar.' : 'Insira seus dados abaixo para começar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
           <AuthToggle authMode={authMode} setAuthMode={setAuthMode} />
          {authMode === "login" ? <LoginForm /> : <SignupForm />}
        </CardContent>
      </Card>
    </div>
  );
}
