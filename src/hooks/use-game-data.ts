
"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, setDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { User, GroupSettings, PlayerSubscriptionType } from "@/components/auth-provider";
import { getActiveOrNextGameDate, formatDateToId } from "@/lib/game-utils";
import { useToast } from "@/hooks/use-toast";

export function useGameData(user: User | null, groupSettings: GroupSettings | null) {
  const { toast } = useToast();
  const [nextGameDate, setNextGameDate] = useState<Date | null>(null);
  const [isGameDateLoading, setIsGameDateLoading] = useState(true);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isConfirmationLocked, setIsConfirmationLocked] = useState(false);
  
  const [confirmedStatus, setConfirmedStatus] = useState<'confirmed' | 'declined' | null>(null);
  const [confirmedPlayers, setConfirmedPlayers] = useState<User[]>([]);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Effect to determine the next game date and its state
  useEffect(() => {
    if (!user?.groupId || !groupSettings) {
      setIsGameDateLoading(false);
      return;
    }
    
    setIsGameDateLoading(true);
    if (groupSettings.gameDays) {
      const gameDate = getActiveOrNextGameDate(groupSettings.gameDays);
      setNextGameDate(gameDate);

      if (gameDate) {
        const now = new Date();
        const gameHasPassed = now > gameDate;
        const gracePeriodEnd = new Date(gameDate.getTime() + 24 * 60 * 60 * 1000);
        const isWithinGracePeriod = now > gameDate && now < gracePeriodEnd;
        
        setIsGameFinished(gameHasPassed);
        setIsConfirmationLocked(gameHasPassed && !isWithinGracePeriod);
      }
    } else {
      setNextGameDate(null);
    }
    setIsGameDateLoading(false);
  }, [user?.groupId, groupSettings]);

  // Effect to fetch confirmed players for the next game
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
      console.error("Error fetching confirmed players:", error);
      setConfirmedPlayers([]);
      setIsFetchingPlayers(false);
    });

    return () => unsubscribe();
  }, [nextGameDate, user?.groupId]);

  // Effect to fetch the current user's confirmation status
  useEffect(() => {
    if (!nextGameDate || !user?.uid || !user?.groupId) {
        setConfirmedStatus(null);
        return;
    }

    const gameId = formatDateToId(nextGameDate);
    const attendeeDocRef = doc(firestore, `groups/${user.groupId}/games/${gameId}/attendees`, user.uid);
    
    const unsubscribe = onSnapshot(attendeeDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setConfirmedStatus(docSnap.data().status);
        } else {
            setConfirmedStatus(null);
        }
    }, (error) => {
      console.error("Error fetching user status:", error);
      setConfirmedStatus(null);
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

  return {
    nextGameDate,
    isGameDateLoading,
    isGameFinished,
    isConfirmationLocked,
    confirmedStatus,
    confirmedPlayers,
    isFetchingPlayers,
    isSubmitting,
    handlePresenceClick,
  };
}
