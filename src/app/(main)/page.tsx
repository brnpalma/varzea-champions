
"use client";

import { useAuth, User, PlayerSubscriptionType } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar, Check, X, Trophy, Wallet, Goal, CheckCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, runTransaction } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { FootballSpinner } from "@/components/ui/football-spinner";
import { useToast } from "@/hooks/use-toast";
import { ConfirmedPlayersDialog } from "@/components/confirmed-players-dialog";
import { GoalsDialog } from "@/components/goals-dialog";

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
        let gracePeriodHours = 10;
        // Check if the next game is too close
        if (nextFutureGame) {
            const hoursUntilNextGame = (nextFutureGame.getTime() - mostRecentPastGame.getTime()) / (1000 * 60 * 60);
            if (hoursUntilNextGame < 10) {
                gracePeriodHours = 5;
            }
        }
        
        const gracePeriodEndDate = new Date(mostRecentPastGame.getTime() + gracePeriodHours * 60 * 60 * 1000);

        // If we are within the grace period of the last game, show it.
        if (now < gracePeriodEndDate) {
            return mostRecentPastGame;
        }
    }

    // Otherwise, show the next upcoming game.
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
  const router = useRouter();
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

            // Logic for Goals Card
            const tenHoursAfterGame = new Date(gameDate.getTime() + 10 * 60 * 60 * 1000);
            const isWithinTenHoursAfterStart = now > gameDate && now < tenHoursAfterGame;
            const isToday = now.getFullYear() === gameDate.getFullYear() &&
                          now.getMonth() === gameDate.getMonth() &&
                          now.getDate() === gameDate.getDate();

            const cardVisible = (isToday || isWithinTenHoursAfterStart) && !goalsSubmitted;
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
      // It's ok if this fails, e.g. permission denied or no game doc yet.
      // Silently fail and show 0.
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
            // If goals field exists and is not null/undefined, consider it submitted
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
      // It's ok if this fails, e.g. permission denied.
      // Silently fail and show no status.
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

    if (status === 'confirmed' && !user.allowConfirmationWithDebt && user.playerSubscriptionType === PlayerSubscriptionType.AVULSO) {
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
            rating: user.rating,
            uid: user.uid,
            email: user.email
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
        
        // Update attendee document with the new goal count for the specific game
        transaction.set(attendeeDocRef, { goals: newGoals }, { merge: true });

        // Update user document with the new total goals count
        transaction.update(userDocRef, { totalGoals: newTotalGoals });
      });

      toast({
        variant: "success",
        title: "Gols Salvos!",
        description: `Você registrou ${newGoals} gols com sucesso.`,
      });
      setGoalsSubmitted(true); // Hide the card after saving
    } catch (error) {
      console.error("Error saving goals:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível registrar seus gols. Tente novamente.",
      });
    }
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
    }).format(date).replace(', ', ' as ');
    
    return {
      line1: weekday.charAt(0).toUpperCase() + weekday.slice(1).replace(',', ''),
      line2: dateTime
    }
  };

  const handleCopyPix = () => {
    if (!groupSettings?.chavePix) return;
    navigator.clipboard.writeText(groupSettings.chavePix);
    toast({
        variant: "success",
        title: "Chave PIX Copiada!",
    });
  };

  const formattedDate = formatNextGameDate(nextGameDate);
  const showPaymentCard = user && (groupSettings?.chavePix || groupSettings?.valorAvulso || groupSettings?.valorMensalidade);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {isGameFinished ? "Última Partida" : "Próxima Partida"}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isGameFinished ? "Veja os detalhes do jogo que acabou." : "Confirme sua presença para o jogo da semana."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <div className="md:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Calendar className="h-6 w-6 text-primary" />
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
                   </div>
                   {isGameFinished && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-6 w-6" />
                        <span className="text-sm font-semibold hidden sm:inline">Realizado</span>
                      </div>
                    )}
                </CardHeader>
              <CardContent className="space-y-4">
                 <p className="text-muted-foreground">{isGameFinished ? "A confirmação para este jogo está encerrada." : "Você vai participar?"}</p>
                 {!isGameFinished && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        size="lg" 
                        onClick={() => handlePresenceClick('confirmed')} 
                        className={`bg-green-600 hover:bg-green-700 text-white ${confirmedStatus === 'confirmed' ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}
                        disabled={!user || isSubmitting || !nextGameDate || confirmedStatus === 'confirmed' || isConfirmationLocked}
                      >
                        <Check className="mr-2 h-5 w-5" /> Sim
                      </Button>
                      <Button 
                        size="lg" 
                        onClick={() => handlePresenceClick('declined')} 
                        variant="destructive"
                        className={`${confirmedStatus === 'declined' ? 'ring-2 ring-offset-2 ring-red-500' : ''}`}
                        disabled={!user || isSubmitting || !nextGameDate || confirmedStatus === 'declined' || isConfirmationLocked}
                      >
                        <X className="mr-2 h-5 w-5" /> Não
                      </Button>
                    </div>
                     <div className="flex items-center justify-center pt-4">
                        <ConfirmedPlayersDialog 
                            confirmedPlayers={confirmedPlayers}
                            isFetchingPlayers={isFetchingPlayers}
                        />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
        </div>
        
        {goalsCardState.visible && (
          <Card className="shadow-lg h-fit">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3">
                <Goal className="h-6 w-6 text-primary" />
                <span>Pós-Jogo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-muted-foreground">Quantos gols você marcou hoje?</p>
              <GoalsDialog
                onSave={handleSaveGoals}
                isDisabled={!goalsCardState.enabled}
              />
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-3">
              <Trophy className="h-6 w-6 text-amber-500" />
              <span>Ranking</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground">
              Veja a classificação de estrelas e artilheiros
            </p>
            <Button asChild>
              <Link href="/ranking">
                Acessar Ranking <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        {showPaymentCard && (
           <Card className="shadow-lg h-fit">
             <CardHeader>
               <CardTitle className="flex items-center justify-center gap-3">
                 <Wallet className="h-6 w-6 text-primary" />
                 <span>Financeiro</span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 text-center">
                {groupSettings.chavePix && (
                 <div className="pb-2">
                    <p className="text-sm text-muted-foreground mb-1">Chave PIX:</p>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary">
                        <code className="truncate">{groupSettings.chavePix}</code>
                        <Button variant="ghost" size="sm" onClick={handleCopyPix}>
                            Copiar
                        </Button>
                    </div>
                 </div>
               )}
                {groupSettings.valorMensalidade && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Mensalidade:</span>
                        <span className="font-bold text-lg">R$ {groupSettings.valorMensalidade.toFixed(2)}</span>
                    </div>
                )}
                 {groupSettings.valorAvulso && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Jogo Avulso:</span>
                        <span className="font-bold text-lg">R$ {groupSettings.valorAvulso.toFixed(2)}</span>
                    </div>
                )}
             </CardContent>
           </Card>
        )}
      </div>
    </div>
  );
}

    

  
