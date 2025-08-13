
"use client";

import { useAuth, UserType } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar, Check, Users, X, Trophy } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  if (!user || user.userType === UserType.GESTOR_QUADRA) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {user ? `Bem-vindo, ${user.displayName}!` : 'Bem-vindo ao AuthFlow!'}
            </h1>
            <p className="text-muted-foreground text-lg">
              Painel de gestão da quadra.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleConfirm = () => setConfirmed(true);
  const handleDecline = () => setConfirmed(false);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Próxima Partida
        </h1>
        <p className="text-muted-foreground text-lg">
          Confirme sua presença para o jogo da semana.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <span>Sábado, 20/07/2024 às 10:00</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Você vai participar?</p>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                size="lg" 
                onClick={handleConfirm} 
                className={`bg-green-600 hover:bg-green-700 text-white ${confirmed === true ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}
              >
                <Check className="mr-2 h-5 w-5" /> Sim
              </Button>
              <Button 
                size="lg" 
                onClick={handleDecline} 
                variant="destructive"
                className={`${confirmed === false ? 'ring-2 ring-offset-2 ring-red-500' : ''}`}
              >
                <X className="mr-2 h-5 w-5" /> Não
              </Button>
            </div>
             <div className="flex items-center justify-center pt-4 text-muted-foreground">
                <Users className="h-5 w-5 mr-2" />
                <span className="font-bold">12</span>
                <span className="ml-1">jogadores confirmados</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-amber-500" />
              <span>Ranking de Jogadores</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Veja a classificação dos artilheiros e os jogadores mais bem avaliados.
            </p>
            <Button asChild>
              <Link href="/ranking">
                Acessar Ranking <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
