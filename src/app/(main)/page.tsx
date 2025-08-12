"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Settings, User } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-10 mb-8">
        <div className="space-y-4 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {user ? `Bem-vindo de volta, ${user.displayName || 'Usuário'}!` : 'Bem-vindo ao Varzea Champions!'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {user ? 'Aqui está o seu painel. Pronto para começar?' : 'Explore o app. Faça login para uma experiência completa.'}
          </p>
        </div>
        <Image 
          src="https://placehold.co/300x200.png" 
          alt="Ilustração de um jogador de futebol"
          width={300}
          height={200}
          className="rounded-lg shadow-lg"
          data-ai-hint="soccer player illustration"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
               <Image src="https://placehold.co/40x40.png" alt="Avatar do jogador" width={40} height={40} className="rounded-full" data-ai-hint="player avatar" />
              <span>Seu Perfil</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {user ? 'Visualize e gerencie suas informações pessoais.' : 'Faça login para visualizar seu perfil.'}
            </p>
            <Button asChild>
              <Link href={user ? "/profile" : "/login"}>
                {user ? 'Ir para o Perfil' : 'Fazer Login'} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Image src="https://placehold.co/40x40.png" alt="Prancheta de táticas" width={40} height={40} className="rounded-full" data-ai-hint="tactics clipboard" />
              <span>Configurações</span>
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
