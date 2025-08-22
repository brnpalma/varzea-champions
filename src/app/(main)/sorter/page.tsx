
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, User } from "@/hooks/use-auth";
import { Dices, Shuffle, Star, Info, LogIn, Users } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { FootballSpinner } from "@/components/ui/football-spinner";
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { SorterConfirmationDialog } from "@/components/sorter-confirmation-dialog";


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
  const [confirmedPlayersCount, setConfirmedPlayersCount] = useState(0);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(true);
  const [nextGameDate, setNextGameDate] = useState<Date | null>(null);
  const [playersPerTeamConfig, setPlayersPerTeamConfig] = useState<number>(5);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);

  const fetchGameSettingsAndDate = useCallback(async () => {
    if (!user?.groupId) return null;
    try {
      const groupDocRef = doc(firestore, "groups", user.groupId);
      const docSnap = await getDoc(groupDocRef);
      if (docSnap.exists()) {
        const groupData = docSnap.data();
        if (groupData.playersPerTeam) {
            setPlayersPerTeamConfig(groupData.playersPerTeam);
        }
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
            setConfirmedPlayersCount(0);
            setIsFetchingPlayers(false);
            return;
        }

        const gameId = formatDateToId(gameDate);
        const attendeesQuery = query(
            collection(firestore, `groups/${user.groupId}/games/${gameId}/attendees`),
            where("status", "==", "confirmed")
        );
        
        const unsubscribe = onSnapshot(attendeesQuery, (snapshot) => {
            setConfirmedPlayersCount(snapshot.size);
            setIsFetchingPlayers(false);
        }, (error) => {
             // Don't show toast, just update state
             setConfirmedPlayersCount(0);
             setIsFetchingPlayers(false);
        });

        return () => unsubscribe();
    });

  }, [user?.groupId, authLoading, fetchGameSettingsAndDate]);


  const handleSort = async (finalPlayerList: User[]) => {
    if (!user?.groupId) {
      toast({
        variant: 'destructive',
        title: 'Você não está em um grupo',
        description: 'É necessário pertencer a um grupo para sortear os times.'
      });
      return;
    }
    
    if (finalPlayerList.length === 0) {
       toast({
        variant: 'destructive',
        title: 'Nenhum jogador confirmado',
        description: 'Não há jogadores confirmados para o próximo jogo.'
      });
      return;
    }

    setIsSorting(true);
    setTeams([]);

    // Give UI time to update before blocking the thread with sorting logic
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const playerPromises = finalPlayerList.map(async (player) => {
            const userDocRef = doc(firestore, 'users', player.uid);
            const userDocSnap = await getDoc(userDocRef);
            return userDocSnap.exists() ? { ...player, ...userDocSnap.data() } as User : player;
        });
        const updatedPlayers = await Promise.all(playerPromises);

        // B. Balanced Sort (Snake Draft + Fine Tuning)
        const numTeams = Math.max(1, Math.floor(updatedPlayers.length / playersPerTeamConfig));
        let teamsDraft: User[][] = Array.from({ length: numTeams }, () => []);
        
        // Phase 1: Snake Draft
        const playersByRating: Record<number, User[]> = {};
        updatedPlayers.forEach(p => {
            const rating = p.rating || 1;
            if (!playersByRating[rating]) playersByRating[rating] = [];
            playersByRating[rating].push(p);
        });
        
        Object.values(playersByRating).forEach(tier => shuffleArray(tier));

        let allPlayersTiered = Object.entries(playersByRating)
            .sort((a, b) => Number(b[0]) - Number(a[0])) // Sort tiers from 5 down to 1
            .flatMap(([, players]) => players);

        let playerIndex = 0;
        let forward = true;
        while(playerIndex < allPlayersTiered.length) {
            if(forward) {
                for(let i = 0; i < numTeams && playerIndex < allPlayersTiered.length; i++) {
                    teamsDraft[i].push(allPlayersTiered[playerIndex++]);
                }
            } else {
                for(let i = numTeams - 1; i >= 0 && playerIndex < allPlayersTiered.length; i--) {
                    teamsDraft[i].push(allPlayersTiered[playerIndex++]);
                }
            }
            forward = !forward;
        }

        // Phase 2: Fine-Tuning Swaps
        const getTeamSum = (team: User[]) => team.reduce((sum, p) => sum + (p.rating || 1), 0);
        
        for (let pass = 0; pass < 5; pass++) {
            for (let i = 0; i < teamsDraft.length; i++) {
                for (let j = i + 1; j < teamsDraft.length; j++) {
                    const teamA = teamsDraft[i];
                    const teamB = teamsDraft[j];
                    const sumA = getTeamSum(teamA);
                    const sumB = getTeamSum(teamB);
                    const initialDiff = Math.abs(sumA - sumB);

                    let bestSwap: { pA_idx: number, pB_idx: number, newDiff: number } | null = null;
                    
                    for (let pA_idx = 0; pA_idx < teamA.length; pA_idx++) {
                        for (let pB_idx = 0; pB_idx < teamB.length; pB_idx++) {
                            const playerA = teamA[pA_idx];
                            const playerB = teamB[pB_idx];

                            const newSumA = sumA - (playerA.rating || 1) + (playerB.rating || 1);
                            const newSumB = sumB - (playerB.rating || 1) + (playerA.rating || 1);
                            const newDiff = Math.abs(newSumA - newSumB);

                            if (newDiff < (bestSwap?.newDiff ?? initialDiff)) {
                                bestSwap = { pA_idx, pB_idx, newDiff };
                            }
                        }
                    }
                    
                    if (bestSwap) {
                        const temp = teamA[bestSwap.pA_idx];
                        teamA[bestSwap.pA_idx] = teamB[bestSwap.pB_idx];
                        teamB[bestSwap.pB_idx] = temp;
                    }
                }
            }
        }
        
        const finalTeams: User[][] = [];
        const leftovers: User[] = [];

        teamsDraft.forEach(team => {
            const mainTeam = team.slice(0, playersPerTeamConfig);
            const teamLeftovers = team.slice(playersPerTeamConfig);
            if (mainTeam.length > 0) {
                 finalTeams.push(mainTeam);
            }
            leftovers.push(...teamLeftovers);
        });

        if (leftovers.length > 0) {
            finalTeams.push(leftovers);
        }

        const shuffledTeams = finalTeams.map(team => shuffleArray(team));
        setTeams(shuffledTeams);

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
      {players.map(player => {
        const playerRating = player.rating || 1;
        return (
          <li key={player.uid} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50">
            <UserAvatar src={player.photoURL} size={40} />
            <div className="flex-1">
              <p className="font-semibold">{player.displayName}</p>
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(playerRating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                {[...Array(5 - playerRating)].map((_, i) => <Star key={i} className="h-4 w-4 text-muted-foreground/50" />)}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  );

  const handleOpenConfirmationDialog = () => {
     if (isSorting || !user?.groupId) {
      toast({
        variant: 'destructive',
        title: 'Ação não permitida',
        description: 'Aguarde o carregamento ou verifique se você está em um grupo.'
      });
      return;
    }
     if (!nextGameDate) {
       toast({
        variant: 'destructive',
        title: 'Nenhuma partida agendada',
        description: 'Não há um próximo jogo agendado para confirmar a presença dos jogadores.'
      });
       return;
     }
    setIsConfirmationDialogOpen(true);
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl">
              <Dices className="h-7 w-7 text-primary" />
              <span>Sorteador de Times</span>
            </CardTitle>
            <CardDescription>
              Clique no botão para gerar os times de forma equilibrada.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
             <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
              <Button size="lg" onClick={handleOpenConfirmationDialog} disabled={isSorting || !user?.groupId} className="w-full sm:w-auto">
                <Shuffle className="mr-2 h-5 w-5" />
                Sortear Times
              </Button>

              <div className="flex items-center justify-center text-muted-foreground font-medium">
                 <Users className="mr-2 h-5 w-5" />
                 {isFetchingPlayers ? (
                    <span>Carregando...</span>
                 ) : (
                    <span>{confirmedPlayersCount} Jogadores Confirmados</span>
                 )}
              </div>
            </div>
             {!isFetchingPlayers && confirmedPlayersCount === 0 && (
                <div className="flex items-center text-sm text-muted-foreground mt-4 text-center">
                    <Info className="h-4 w-4 mr-2 shrink-0" />
                    <span>Nenhuma partida agendada ou nenhum jogador confirmado.</span>
                </div>
            )}
          </CardContent>
        </Card>

        {isSorting && (
           <div className="flex justify-center items-center py-12 h-full">
              <FootballSpinner />
            </div>
        )}
        
        {user && user.groupId && (
            <SorterConfirmationDialog 
                isOpen={isConfirmationDialogOpen}
                setIsOpen={setIsConfirmationDialogOpen}
                onConfirm={handleSort}
                groupId={user.groupId}
                nextGameDate={nextGameDate}
            />
        )}


        {teams.length > 0 && !isSorting && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {teams.map((team, index) => {
              if(team.length === 0) return null;
              
              const teamSum = team.reduce((sum, p) => sum + (p.rating || 1), 0);
              const totalTeams = Math.floor(confirmedPlayersCount / playersPerTeamConfig);
              const isLeftoverTeam = index >= totalTeams && teams.length > totalTeams;

              const title = isLeftoverTeam ? "Próximos" : `Time ${String.fromCharCode(65 + index)}`;

              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{title}</CardTitle>
                     {!isLeftoverTeam && (
                        <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                           {teamSum} <Star className="h-4 w-4 fill-current"/>
                        </div>
                     )}
                  </CardHeader>
                  <CardContent>
                    {renderPlayerList(team)}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!authLoading && !user && (
          <div className="mt-8">
            <Card className="shadow-lg text-center">
              <CardHeader>
                <CardTitle>Faça Login para Sortear</CardTitle>
                <CardDescription>
                  Você precisa estar em um grupo para sortear os times.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="lg">
                  <Link href="/login">
                    <LogIn className="mr-2" />
                    Fazer Login ou Criar Conta
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

