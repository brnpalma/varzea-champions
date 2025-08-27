
"use client";

import { useAuth, User, PlayerSubscriptionType, UserType } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, runTransaction, getDocs, writeBatch } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { EventCard } from "@/components/dashboard/event-card";
import { PostGameCard } from "@/components/dashboard/post-game-card";
import { EquipmentCard } from "@/components/dashboard/equipment-card";
import { FinancialCard } from "@/components/dashboard/financial-card";
import { InviteButton } from "@/components/invite-button";


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

function getActiveOrNextGameDate(gameDays: Record<string, GameDaySetting>): Date | null {
    if (!gameDays || Object.keys(gameDays).length === 0) return null;

    const now = new Date();
    const allGameDates: Date[] = [];

    // Look for games from the last 7 days up to 14 days in the future
    for (let i = -7; i < 14; i++) {
        const checkingDate = new Date();
        checkingDate.setDate(now.getDate() + i);
        const dayOfWeek = checkingDate.getDay();
        const dayId = Object.keys(dayOfWeekMap).find(key => dayOfWeekMap[key] === dayOfWeek);

        if (dayId && gameDays[dayId]?.selected && gameDays[dayId]?.time) {
            const [hours, minutes] = gameDays[dayId].time.split(':').map(Number);
            const gameTime = new Date(checkingDate);
            gameTime.setHours(hours, minutes, 0, 0);
            allGameDates.push(gameTime);
        }
    }

    if (allGameDates.length === 0) return null;

    // Sort dates
    allGameDates.sort((a, b) => a.getTime() - b.getTime());

    const futureGames = allGameDates.filter(d => d > now);
    const pastGames = allGameDates.filter(d => d <= now);

    const mostRecentPastGame = pastGames.length > 0 ? pastGames[pastGames.length - 1] : null;
    const nextFutureGame = futureGames.length > 0 ? futureGames[0] : null;

    if (mostRecentPastGame) {
        let gracePeriodHours = 24; // Default grace period
        
        if (nextFutureGame) {
            const lastGameEndTime = new Date(mostRecentPastGame.getTime() + 2 * 60 * 60 * 1000); // Assuming 2h duration
            const hoursUntilNextGame = (nextFutureGame.getTime() - lastGameEndTime.getTime()) / (1000 * 60 * 60);
            
            if (hoursUntilNextGame < gracePeriodHours) {
              gracePeriodHours = Math.max(0, hoursUntilNextGame - 1);
            }
        }
        
        const gracePeriodEndDate = new Date(mostRecentPastGame.getTime() + gracePeriodHours * 60 * 60 * 1000);

        if (now < gracePeriodEndDate) {
            return mostRecentPastGame;
        }
    }

    return nextFutureGame;
}


const formatDateToId = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
}


export default function HomePage() {
  const { user, groupSettings, loading } = useAuth();
  const { toast } = useToast();
  
  const [confirmedStatus, setConfirmedStatus] = useState<'confirmed' | 'declined' | null>(null);
  const [confirmedPlayers, setConfirmedPlayers] = useState<User[]>([]);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(true);
  const [nextGameDate, setNextGameDate] = useState<Date | null>(null);
  const [isGameDateLoading, setIsGameDateLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmationLocked, setIsConfirmationLocked] = useState(false);
  const [goalsSubmitted, setGoalsSubmitted] = useState(false);
  const [goalsCardState, setGoalsCardState] = useState({ visible: false, enabled: false });
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [equipmentManager, setEquipmentManager] = useState<{next: User | null}>({ next: null });
  const [isLoadingManager, setIsLoadingManager] = useState(false);
  const isManager = user?.userType === UserType.GESTOR_GRUPO;
  const previousGameDateRef = useRef<string | null>(null);


  const fetchGameSettings = useCallback(async () => {
    if (!user?.groupId) {
      setIsGameDateLoading(false);
      return;
    }
    setIsGameDateLoading(true);
    try {
        if (groupSettings && groupSettings.gameDays) {
          const gameDate = getActiveOrNextGameDate(groupSettings.gameDays);
          setNextGameDate(gameDate);
          
          if (gameDate) {
            const now = new Date();
            const gameHasPassed = now > gameDate;
            setIsGameFinished(gameHasPassed);
            setIsConfirmationLocked(gameHasPassed);

            const twentyFourHoursAfterGame = new Date(gameDate.getTime() + 24 * 60 * 60 * 1000);
            const isWithin24HoursAfterStart = now > gameDate && now < twentyFourHoursAfterGame;

            const cardVisible = isWithin24HoursAfterStart && !goalsSubmitted;
            const cardEnabled = gameHasPassed;
            
            setGoalsCardState({ visible: cardVisible, enabled: cardEnabled });
          } else {
             setGoalsCardState({ visible: false, enabled: false });
          }
        } else {
          setNextGameDate(null);
        }
    } catch (error) {
      console.error("Error fetching game settings:", error);
      setNextGameDate(null);
    } finally {
      setIsGameDateLoading(false);
    }
  }, [user?.groupId, groupSettings, goalsSubmitted]);


  useEffect(() => {
    if (loading) return;
    fetchGameSettings();
  }, [user, loading, fetchGameSettings]);
  
  const fetchEquipmentManager = useCallback(async () => {
      if (!groupSettings?.enableEquipmentManager || !user?.groupId) {
          setEquipmentManager({ next: null });
          return;
      }
  
      setIsLoadingManager(true);
      try {
          const playersQuery = query(
              collection(firestore, 'users'),
              where('groupId', '==', user.groupId)
          );
          const querySnapshot = await getDocs(playersQuery);
          let allPlayers = querySnapshot.docs.map(doc => doc.data() as User);
          
          if (allPlayers.length > 0) {
              allPlayers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
              
              let nextManager = allPlayers.find(p => !p.lavouColete);

              if (!nextManager) {
                  nextManager = allPlayers[0];
              }
               
              setEquipmentManager({ next: nextManager });
          } else {
              setEquipmentManager({ next: null });
          }
      } catch (error) {
          console.error("Error fetching players for equipment manager:", error);
          setEquipmentManager({ next: null });
      } finally {
          setIsLoadingManager(false);
      }
  }, [groupSettings, user?.groupId]);


  const updateEquipmentManagerRotation = useCallback(async () => {
    if (!user?.groupId || !groupSettings?.enableEquipmentManager) return;
    try {
        const playersQuery = query(
            collection(firestore, 'users'),
            where('groupId', '==', user.groupId)
        );
        const querySnapshot = await getDocs(playersQuery);
        let allPlayers = querySnapshot.docs.map(doc => doc.data() as User);

        if (allPlayers.length === 0) return;

        allPlayers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

        let currentManager = allPlayers.find(p => !p.lavouColete);
        if (!currentManager) {
            currentManager = allPlayers[allPlayers.length - 1];
        }

        if (!currentManager) return;

        const batch = writeBatch(firestore);
        
        const currentManagerRef = doc(firestore, 'users', currentManager.uid);
        batch.update(currentManagerRef, { lavouColete: true });

        const remainingPlayers = allPlayers.filter(p => !p.lavouColete && p.uid !== currentManager.uid);

        if (remainingPlayers.length === 0) {
            allPlayers.forEach(player => {
                if (player.uid !== currentManager.uid) {
                  const playerRef = doc(firestore, 'users', player.uid);
                  batch.update(playerRef, { lavouColete: false });
                }
            });
            toast({
              title: "Rodízio de Coletes Reiniciado!",
              description: "Todos os jogadores cumpriram sua vez. O ciclo foi reiniciado.",
              variant: "success"
            });
        }

        await batch.commit();
        fetchEquipmentManager();
    } catch (error) {
        console.error("Error updating equipment manager rotation:", error);
        toast({
            title: "Erro ao atualizar rodízio",
            description: "Não foi possível atualizar o responsável pelos coletes.",
            variant: "destructive"
        });
    }
  }, [user?.groupId, groupSettings?.enableEquipmentManager, toast, fetchEquipmentManager]);


  useEffect(() => {
    fetchEquipmentManager();
  }, [fetchEquipmentManager]);

  useEffect(() => {
      const currentGameId = nextGameDate ? formatDateToId(nextGameDate) : null;
      
      if (previousGameDateRef.current && currentGameId && previousGameDateRef.current !== currentGameId) {
          const previousDate = new Date(previousGameDateRef.current);
          const now = new Date();
          if (previousDate < now && nextGameDate! > now) {
            updateEquipmentManagerRotation();
          }
      }
      previousGameDateRef.current = currentGameId;
  }, [nextGameDate, updateEquipmentManagerRotation]);


  useEffect(() => {
    if (!nextGameDate || !user?.groupId) {
        setConfirmedPlayers([]);
        setIsFetchingPlayers(false);
        return;
    }

    setIsFetchingPlayers(true);
    const gameId = formatDateToId(nextGameDate);
    const attendeesQuery = query(
        collection(firestore, `groups/${user.groupId}/games/${gameId}/attendees`),
        where("status", "==", "confirmed")
    );
    
    const unsubscribe = onSnapshot(attendeesQuery, (snapshot) => {
        const playersData = snapshot.docs.map(doc => doc.data() as User);
        setConfirmedPlayers(playersData);
        setIsFetchingPlayers(false);
    }, (error) => {
      setConfirmedPlayers([]);
      setIsFetchingPlayers(false);
    });

    return () => unsubscribe();

  }, [nextGameDate, user?.groupId]);


  useEffect(() => {
    if (!nextGameDate || !user?.uid || !user?.groupId) {
        setConfirmedStatus(null);
        setGoalsSubmitted(false);
        return;
    }

    const gameId = formatDateToId(nextGameDate);
    const attendeeDocRef = doc(firestore, `groups/${user.groupId}/games/${gameId}/attendees`, user.uid);
    
    const unsubscribe = onSnapshot(attendeeDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setConfirmedStatus(data.status);
            if (data.goals !== null && data.goals !== undefined) {
              setGoalsSubmitted(true);
            } else {
              setGoalsSubmitted(false);
            }
        } else {
            setConfirmedStatus(null);
            setGoalsSubmitted(false);
        }
    }, (error) => {
      setConfirmedStatus(null);
      setGoalsSubmitted(false);
    });

    return () => unsubscribe();
    
  }, [nextGameDate, user?.uid, user?.groupId]);


  const handlePresenceClick = async (status: 'confirmed' | 'declined') => {
    if (!user || !user.groupId || !nextGameDate || isGameFinished) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: isGameFinished ? "Este jogo já foi encerrado." : "Não foi possível registrar sua presença.",
      });
      return;
    }

    if (new Date() > nextGameDate) {
        toast({
            variant: "destructive",
            title: "Tempo Esgotado",
            description: "O horário para confirmar presença neste jogo já passou.",
        });
        setIsConfirmationLocked(true);
        return;
    }

    if (status === 'confirmed' && !groupSettings?.allowConfirmationWithDebt && user.playerSubscriptionType === PlayerSubscriptionType.AVULSO) {
        toast({
            variant: "destructive",
            title: "Pendência Financeira",
            description: "Você possui mensalidades em atraso. Entre em contato com o gestor do grupo.",
        });
        return;
    }
    
    setIsSubmitting(true);
    const oldStatus = confirmedStatus;
    setConfirmedStatus(status); // Optimistic update

    const gameId = formatDateToId(nextGameDate);
    const attendeeDocRef = doc(firestore, `groups/${user.groupId}/games/${gameId}/attendees`, user.uid);
    
    try {
        await setDoc(attendeeDocRef, {
            status: status,
            confirmedAt: new Date().toISOString(),
            displayName: user.displayName,
            photoURL: user.photoURL,
            uid: user.uid,
        }, { merge: true });
        toast({
            variant: "success",
            title: "Presença Registrada!",
            description: `Sua presença foi ${status === 'confirmed' ? 'confirmada' : 'recusada'} com sucesso.`,
        });
    } catch (error) {
        console.error("Error setting presence:", error);
        toast({
            variant: "destructive",
            title: "Erro ao registrar",
            description: "Houve um problema ao salvar sua resposta.",
        });
        setConfirmedStatus(oldStatus); // Revert optimistic update
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSaveGoals = async (newGoals: number) => {
    if (!user || !user.groupId || !nextGameDate) {
      toast({ variant: "destructive", title: "Erro", description: "Dados do usuário ou do jogo não encontrados." });
      return;
    }

    if (new Date() < nextGameDate) {
       toast({
        variant: "destructive",
        title: "Aguarde",
        description: "Você só pode registrar gols após o início da partida.",
      });
      return;
    }

    const gameId = formatDateToId(nextGameDate);
    const attendeeDocRef = doc(firestore, `groups/${user.groupId}/games/${gameId}/attendees`, user.uid);
    const userDocRef = doc(firestore, "users", user.uid);

    try {
      await runTransaction(firestore, async (transaction) => {
        const attendeeDoc = await transaction.get(attendeeDocRef);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists()) {
          throw new Error("Documento do usuário não encontrado!");
        }

        const oldGoals = attendeeDoc.data()?.goals || 0;
        const goalsDifference = newGoals - oldGoals;
        
        const currentTotalGoals = userDoc.data()?.totalGoals || 0;
        const newTotalGoals = currentTotalGoals + goalsDifference;
        
        transaction.set(attendeeDocRef, { goals: newGoals }, { merge: true });
        transaction.update(userDocRef, { totalGoals: newTotalGoals });
      });

      toast({
        variant: "success",
        title: "Gols Salvos!",
        description: `Você registrou ${newGoals} gols com sucesso.`,
      });
      setGoalsSubmitted(true);
    } catch (error) {
      console.error("Error saving goals:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível registrar seus gols. Tente novamente.",
      });
    }
  };

  const showPaymentCard = user && (groupSettings?.chavePix || groupSettings?.valorAvulso || groupSettings?.valorMensalidade);
  const showEquipmentCard = groupSettings?.enableEquipmentManager && user;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {isGameFinished ? "Última Partida" : "Próxima Partida"}
        </h1>

        {!loading && !user && (
          <Card className="max-w-4xl mx-auto shadow-lg text-center">
            <CardHeader>
              <CardTitle>Bem-vindo ao Várzea Champions</CardTitle>
              <CardDescription>
                Faça login para gerenciar seu time, confirmar presença e muito mais.
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
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <div className="md:col-span-2">
            <EventCard 
                user={user}
                nextGameDate={nextGameDate}
                isGameDateLoading={isGameDateLoading}
                isGameFinished={isGameFinished}
                confirmedStatus={confirmedStatus}
                isSubmitting={isSubmitting}
                isConfirmationLocked={isConfirmationLocked}
                onPresenceClick={handlePresenceClick}
                confirmedPlayers={confirmedPlayers}
                isFetchingPlayers={isFetchingPlayers}
                isManager={isManager}
            />
        </div>
        
        {showEquipmentCard && (
            <div className="md:col-span-2">
                <EquipmentCard
                    isLoadingManager={isLoadingManager}
                    equipmentManager={equipmentManager}
                />
            </div>
        )}

        {goalsCardState.visible && (
          <PostGameCard 
            onSaveGoals={handleSaveGoals}
            goalsCardState={goalsCardState}
          />
        )}
        
        {showPaymentCard && groupSettings && (
           <FinancialCard groupSettings={groupSettings} />
        )}
      </div>
    </div>
  );
}
