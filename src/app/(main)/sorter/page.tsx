
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, User } from "@/hooks/use-auth";
import { Dices, Shuffle, Star, Info } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { FootballSpinner } from "@/components/ui/football-spinner";
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/hooks/use-toast";
import { ConfirmedPlayersDialog } from "@/components/confirmed-players-dialog";

// Duplicated from home page, consider moving to a shared utility file
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
    if (dayId && gameDays[dayId] && gameDays[dayId]?.selected && gameDays[dayId]?.time) {
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
  if (!nextGameDate) {
     for (let i = 7; i < 14; i++) {
        const checkingDate = new Date(now);
        checkingDate.setDate(now.getDate() + i);
        const dayOfWeek = checkingDate.getDay();
        const dayId = Object.keys(dayOfWeekMap).find(key => dayOfWeekMap[key] === dayOfWeek);
        if (dayId && gameDays[dayId] && gameDays[dayId]?.selected && gameDays[dayId]?.time) {
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

const formatDateToId = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
}


const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function SorterPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isSorting, setIsSorting] = useState(false);
  const [teams, setTeams] = useState<User[][]>([]);
  const [confirmedPlayers, setConfirmedPlayers] = useState<User[]>([]);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(true);
  const [nextGameDate, setNextGameDate] = useState<Date | null>(null);

  const fetchGameSettingsAndDate = useCallback(async () => {
    if (!user?.groupId) return null;
    try {
      const groupDocRef = doc(firestore, "groups", user.groupId);
      const docSnap = await getDoc(groupDocRef);
      if (docSnap.exists()) {
        const groupData = docSnap.data();
        if (groupData.gameDays) {
          const gameDate = getNextGameDate(groupData.gameDays);
          setNextGameDate(gameDate);
          return gameDate;
        }
      }
    } catch (error) {
      console.error("Error fetching game settings for sorter:", error);
    }
    setNextGameDate(null);
    return null;
  }, [user?.groupId]);

  useEffect(() => {
    if (authLoading) return;
    
    setIsFetchingPlayers(true);
    fetchGameSettingsAndDate().then(gameDate => {
        if (!gameDate || !user?.groupId) {
            setConfirmedPlayers([]);
            setIsFetchingPlayers(false);
            return;
        }

        const gameId = formatDateToId(gameDate);
        const attendeesQuery = query(
            collection(firestore, `groups/${user.groupId}/games/${gameId}/attendees`),
            where("status", "==", "confirmed")
        );
        
        const unsubscribe = onSnapshot(attendeesQuery, (snapshot) => {
            const playersData = snapshot.docs.map(doc => doc.data() as User);
            setConfirmedPlayers(playersData);
            setIsFetchingPlayers(false);
        }, (error) => {
             // Don't show toast, just update state
             setConfirmedPlayers([]);
             setIsFetchingPlayers(false);
        });

        return () => unsubscribe();
    });

  }, [user?.groupId, authLoading, fetchGameSettingsAndDate]);


  const handleSort = async () => {
    if (!user?.groupId) {
      toast({
        variant: 'destructive',
        title: 'Você não está em um grupo',
        description: 'É necessário pertencer a um grupo para sortear os times.'
      });
      return;
    }
    
    if (confirmedPlayers.length === 0) {
       toast({
        variant: 'destructive',
        title: 'Nenhum jogador confirmado',
        description: 'Não há jogadores confirmados para o próximo jogo.'
      });
      return;
    }

    setIsSorting(true);
    setTeams([]);

    try {
      const groupDocRef = doc(firestore, "groups", user.groupId);
      const groupDocSnap = await getDoc(groupDocRef);

      if (!groupDocSnap.exists()) {
        throw new Error("Documento do grupo não encontrado.");
      }
      
      const playersPerTeam = groupDocSnap.data()?.playersPerTeam || 5;
      
      const numberOfTeams = Math.floor(confirmedPlayers.length / playersPerTeam);

      if (numberOfTeams < 1) {
        toast({
          variant: 'destructive',
          title: 'Jogadores Insuficientes',
          description: `São necessários pelo menos ${playersPerTeam} jogadores confirmados para formar um time.`
        });
        setIsSorting(false);
        return;
      }
      
      const playersToSort = confirmedPlayers.slice(0, numberOfTeams * playersPerTeam);
      
      const playersByRating: Record<string, User[]> = { '5': [], '4': [], '3': [], '2': [], '1': [], '0': [] };
      playersToSort.forEach(p => {
        const rating = p.rating || 0;
        if (playersByRating[rating]) {
          playersByRating[rating].push(p);
        } else {
          playersByRating['0'].push(p) 
        }
      });
      
      Object.keys(playersByRating).forEach(rating => {
        shuffleArray(playersByRating[rating]);
      });

      const finalTeams: User[][] = Array.from({ length: numberOfTeams }, () => []);
      let teamIndex = 0;

      for (let rating = 5; rating >= 0; rating--) {
        const players = playersByRating[rating.toString()];
        for (const player of players) {
          finalTeams[teamIndex].push(player);
          teamIndex = (teamIndex + 1) % numberOfTeams;
        }
      }

      setTeams(finalTeams);

    } catch (error) {
       console.error("Error sorting teams:", error);
       toast({
        variant: 'destructive',
        title: 'Erro no Sorteio',
        description: 'Não foi possível buscar as configurações do grupo para o sorteio.'
      });
    } finally {
      setIsSorting(false);
    }
  };

  const renderPlayerList = (players: User[]) => (
    <ul className="space-y-3">
      {players.map(player => (
        <li key={player.uid} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50">
          <UserAvatar src={player.photoURL} size={40} />
          <div className="flex-1">
            <p className="font-semibold">{player.displayName}</p>
            <div className="flex items-center gap-1 text-amber-500">
               {[...Array(player.rating || 0)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
               {[...Array(5 - (player.rating || 0))].map((_, i) => <Star key={i} className="h-4 w-4 text-muted-foreground/50" />)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Dices className="h-7 w-7 text-primary" />
              <span>Sorteador de Times</span>
            </CardTitle>
            <CardDescription>
              Clique no botão para gerar times equilibrados com base na classificação dos jogadores confirmados.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <Button size="lg" onClick={handleSort} disabled={isSorting || !user?.groupId || confirmedPlayers.length === 0}>
                {isSorting ? (
                  <>
                    <FootballSpinner className="h-6 w-6 mr-2 animate-spin" />
                    Sorteando...
                  </>
                ) : (
                  <>
                    <Shuffle className="mr-2 h-5 w-5" />
                    Sortear Times
                  </>
                )}
              </Button>

              <ConfirmedPlayersDialog 
                confirmedPlayers={confirmedPlayers}
                isFetchingPlayers={isFetchingPlayers}
              />
            </div>
             {!isFetchingPlayers && confirmedPlayers.length === 0 && (
                <div className="flex items-center text-sm text-muted-foreground mt-4">
                    <Info className="h-4 w-4 mr-2" />
                    <span>Nenhum jogador confirmado para a próxima partida.</span>
                </div>
            )}
          </CardContent>
        </Card>

        {isSorting && (
           <div className="flex justify-center items-center py-12">
              <FootballSpinner />
            </div>
        )}

        {teams.length > 0 && !isSorting && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {teams.map((team, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>Time {String.fromCharCode(65 + index)} ({team.length} jogadores)</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderPlayerList(team)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
