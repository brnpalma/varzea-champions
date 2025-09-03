
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Dices, Shuffle, Star, Info, LogIn } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { FootballSpinner } from "@/components/ui/football-spinner";
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { SorterConfirmationDialog } from "@/components/sorter-confirmation-dialog";
import { performBalancedSort } from "@/lib/sorter";
import { useGameData } from "@/hooks/use-game-data";
import { User } from "@/hooks/use-auth";

export default function SorterPage() {
  const { user, loading: authLoading, groupSettings } = useAuth();
  const { toast } = useToast();
  
  const [isSorting, setIsSorting] = useState(false);
  const [teams, setTeams] = useState<User[][]>([]);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  
  const {
    nextGameDate,
    confirmedPlayersCount,
    isFetchingPlayers,
  } = useGameData(user, groupSettings);

  const playersPerTeamConfig = groupSettings?.playersPerTeam || 5;


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

        const { teams: sortedTeams } = performBalancedSort(updatedPlayers, playersPerTeamConfig);
        
        setTeams(sortedTeams);

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
                 {isFetchingPlayers ? (
                    <FootballSpinner />
                 ) : (
                    <span>{confirmedPlayersCount} Jogadores Confirmados</span>
                 )}
              </div>
            </div>
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
              const totalPlayers = teams.flat().length;
              const numFullTeams = Math.floor(totalPlayers / playersPerTeamConfig);
              const isLeftoverTeam = index >= numFullTeams;

              const title = isLeftoverTeam ? "Próximos" : `Time ${String.fromCharCode(65 + index)}`;

              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{title}</CardTitle>
                    <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                        {teamSum} <Star className="h-4 w-4 fill-current"/>
                    </div>
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
