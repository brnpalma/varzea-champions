
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, User, UserType } from "@/hooks/use-auth";
import { Dices, Shuffle, Star } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { FootballSpinner } from "@/components/ui/football-spinner";
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/hooks/use-toast";

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function SorterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<User[][]>([]);

  const handleSort = async () => {
    if (!user?.groupId) {
      toast({
        variant: 'destructive',
        title: 'Você não está em um grupo',
        description: 'É necessário pertencer a um grupo para sortear os times.'
      });
      return;
    }

    setIsLoading(true);
    setTeams([]);

    try {
      const groupDocRef = doc(firestore, "groups", user.groupId);
      const groupDocSnap = await getDoc(groupDocRef);

      if (!groupDocSnap.exists()) {
        throw new Error("Group document not found.");
      }
      
      const playersPerTeam = groupDocSnap.data()?.playersPerTeam || 5;

      const playersQuery = query(
        collection(firestore, 'users'),
        where('groupId', '==', user.groupId)
      );

      const querySnapshot = await getDocs(playersQuery);
      const allPlayers = querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id })) as User[];
      
      const numberOfTeams = Math.floor(allPlayers.length / playersPerTeam);

      if (numberOfTeams < 1) {
        toast({
          variant: 'destructive',
          title: 'Jogadores Insuficientes',
          description: `São necessários pelo menos ${playersPerTeam} jogadores para formar um time.`
        });
        setIsLoading(false);
        return;
      }
      
      const playersToSort = allPlayers.slice(0, numberOfTeams * playersPerTeam);
      
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
        description: 'Não foi possível buscar os jogadores para o sorteio.'
      });
    } finally {
      setIsLoading(false);
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
              Clique no botão para gerar times equilibrados com base na classificação dos jogadores.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" onClick={handleSort} disabled={isLoading || !user?.groupId}>
              {isLoading ? (
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
          </CardContent>
        </Card>

        {isLoading && (
           <div className="flex justify-center items-center py-12">
              <FootballSpinner />
            </div>
        )}

        {teams.length > 0 && !isLoading && (
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
