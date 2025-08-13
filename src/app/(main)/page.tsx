
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar, Check, Users, X, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { FootballSpinner } from "@/components/ui/football-spinner";

interface GameDaySetting {
  selected: boolean;
  time: string;
}

const dayOfWeekMap: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

function getNextGameDate(gameDays: Record<string, GameDaySetting>): Date | null {
  if (!gameDays || Object.keys(gameDays).length === 0) return null;

  const now = new Date();
  let nextGameDate: Date | null = null;

  for (let i = 0; i < 7; i++) {
    const checkingDate = new Date(now);
    checkingDate.setDate(now.getDate() + i);
    const dayOfWeek = checkingDate.getDay();

    const dayId = Object.keys(dayOfWeekMap).find(key => dayOfWeekMap[key] === dayOfWeek);

    if (dayId && gameDays[dayId]?.selected && gameDays[dayId]?.time) {
      const [hours, minutes] = gameDays[dayId].time.split(':').map(Number);
      const gameTime = new Date(checkingDate);
      gameTime.setHours(hours, minutes, 0, 0);

      if (gameTime > now) {
        if (!nextGameDate || gameTime < nextGameDate) {
          nextGameDate = gameTime;
        }
      }
    }
  }
  
  // If no game this week, check next week
  if (!nextGameDate) {
     for (let i = 7; i < 14; i++) {
        const checkingDate = new Date(now);
        checkingDate.setDate(now.getDate() + i);
        const dayOfWeek = checkingDate.getDay();

        const dayId = Object.keys(dayOfWeekMap).find(key => dayOfWeekMap[key] === dayOfWeek);

        if (dayId && gameDays[dayId]?.selected && gameDays[dayId]?.time) {
          const [hours, minutes] = gameDays[dayId].time.split(':').map(Number);
          const gameTime = new Date(checkingDate);
          gameTime.setHours(hours, minutes, 0, 0);

           if (!nextGameDate || gameTime < nextGameDate) {
              nextGameDate = gameTime;
           }
        }
    }
  }


  return nextGameDate;
}


export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [nextGameDate, setNextGameDate] = useState<Date | null>(null);
  const [isGameDateLoading, setIsGameDateLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    async function fetchGameSettings() {
      if (!user?.groupId) {
        setIsGameDateLoading(false);
        return;
      }
      setIsGameDateLoading(true);
      const groupDocRef = doc(firestore, "groups", user.groupId);
      const docSnap = await getDoc(groupDocRef);
      if (docSnap.exists()) {
        const groupData = docSnap.data();
        const gameDate = getNextGameDate(groupData.gameDays);
        setNextGameDate(gameDate);
      }
      setIsGameDateLoading(false);
    }

    fetchGameSettings();
  }, [user, loading]);

  const handlePresenceClick = () => {
    if (!user) {
      router.push('/login');
    }
  };

  const handleConfirm = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setConfirmed(true);
  };

  const handleDecline = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setConfirmed(false);
  };
  
  const formatNextGameDate = (date: Date | null) => {
    if (!date) {
      return {
        line1: "Nenhuma partida agendada.",
        line2: null,
      };
    }

    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
    
    const dateTime = new Intl.DateTimeFormat('pt-BR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date).replace(' ', '');
    
    return {
      line1: weekday.charAt(0).toUpperCase() + weekday.slice(1).replace(',', ''),
      line2: dateTime
    }
  };

  const formattedDate = formatNextGameDate(nextGameDate);

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
            <CardTitle className="flex items-start gap-3">
              <Calendar className="h-6 w-6 text-primary mt-1" />
               {isGameDateLoading ? (
                  <div className="w-full flex justify-center items-center py-4">
                    <FootballSpinner />
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{formattedDate.line1}</span>
                    {formattedDate.line2 && <span className="text-lg font-medium text-muted-foreground">{formattedDate.line2}</span>}
                  </div>
                )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Você vai participar?</p>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                size="lg" 
                onClick={handleConfirm} 
                className={`bg-green-600 hover:bg-green-700 text-white ${confirmed === true ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}
                disabled={!user}
              >
                <Check className="mr-2 h-5 w-5" /> Sim
              </Button>
              <Button 
                size="lg" 
                onClick={handleDecline} 
                variant="destructive"
                className={`${confirmed === false ? 'ring-2 ring-offset-2 ring-red-500' : ''}`}
                disabled={!user}
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
