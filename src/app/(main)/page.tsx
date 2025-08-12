"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, User, Settings } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Bem-vindo de volta, {user?.displayName || "Usuário"}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Aqui está o seu painel. Pronto para começar?
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <span>Seu Perfil</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Visualize e gerencie suas informações pessoais e detalhes de autenticação.
            </p>
            <Button asChild>
              <Link href="/profile">
                Ir para o Perfil <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-accent" />
              <span>Configurações do App</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Personalize suas preferências e configurações do aplicativo.
            </p>
            <Button asChild variant="secondary">
              <Link href="/settings">
                Ir para Configurações <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
