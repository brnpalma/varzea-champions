
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star } from "lucide-react";
import { useAuth, User } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FootballSpinner } from '@/components/ui/football-spinner';
import { UserAvatar } from '@/components/user-avatar';
import { Badge } from '@/components/ui/badge';

const getTrophyColor = (rank: number) => {
  switch(rank) {
    case 1: return "text-amber-400"; // Gold
    case 2: return "text-slate-400"; // Silver
    case 3: return "text-amber-700"; // Bronze
    default: return "text-muted-foreground";
  }
}

export default function RankingPage() {
  const { user, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user?.groupId) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const playersQuery = query(
      collection(firestore, 'users'), 
      where('groupId', '==', user.groupId)
    );
    
    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }) as User);
      setPlayers(playersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching players for ranking:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.groupId, authLoading]);

  const topScorers = useMemo(() => {
    return [...players].sort((a, b) => {
      const goalsDiff = (b.totalGoals || 0) - (a.totalGoals || 0);
      if (goalsDiff !== 0) return goalsDiff;
      return (a.displayName || '').localeCompare(b.displayName || '');
    });
  }, [players]);

  const topRated = useMemo(() => {
    return [...players].sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (a.displayName || '').localeCompare(b.displayName || '');
    });
  }, [players]);

  const renderPlayerList = (players: User[], type: 'goals' | 'rating') => {
    if (players.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-secondary/50">
          <p className="text-muted-foreground">
            Ainda não há dados suficientes para exibir o ranking.
          </p>
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {players.map((player, index) => (
          <li key={player.uid} className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-secondary/50">
            <div className="flex items-center gap-2 w-10">
              <span className={`font-bold text-lg ${index < 3 ? 'text-foreground' : 'text-muted-foreground'}`}>{index + 1}</span>
              {index < 3 && <Trophy className={`h-5 w-5 ${getTrophyColor(index + 1)}`} />}
            </div>
            
            <UserAvatar src={player.photoURL} size={48} />
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{player.displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{player.email}</p>
            </div>
            
            {type === 'goals' ? (
              <div className="flex items-center justify-end w-12">
                  <span className="text-2xl font-bold text-primary">{player.totalGoals || 0}</span>
              </div>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-2 text-base">
                 <Star className="h-4 w-4 text-amber-500 fill-current" />
                 {player.rating || 1}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    );
  };
  
  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex justify-center">
        <FootballSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Trophy className="h-7 w-7 text-amber-500" />
            <span>Ranking</span>
          </CardTitle>
          <CardDescription>
            Veja a classificação de estrelas e artilheiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scorers">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scorers">Artilheiros</TabsTrigger>
              <TabsTrigger value="rated">Melhores Avaliados</TabsTrigger>
            </TabsList>
            <TabsContent value="scorers" className="mt-4">
              {renderPlayerList(topScorers, 'goals')}
            </TabsContent>
            <TabsContent value="rated" className="mt-4">
              {renderPlayerList(topRated, 'rating')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
