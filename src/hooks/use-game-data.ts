
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { doc, setDoc, collection, query, where, onSnapshot, getDocs, writeBatch, deleteDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { User, GroupSettings, PlayerSubscriptionType, UserType } from "@/components/auth-provider";
import { getActiveOrNextGame, GameInfo, formatDateToId } from "@/lib/game-utils";
import { useToast } from "@/hooks/use-toast";

export function useGameData(user: User | null, groupSettings: GroupSettings | null) {
  const { toast } = useToast();
  const [nextGameDate, setNextGameDate] = useState<Date | null>(null);
  const [isGameDateLoading, setIsGameDateLoading] = useState(true);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isConfirmationLocked, setIsConfirmationLocked] = useState(false);
  
  const [confirmedStatus, setConfirmedStatus] = useState<'confirmed' | 'declined' | null>(null);
  const [confirmedPlayers, setConfirmedPlayers] = useState<User[]>([]);
  const [confirmedPlayersCount, setConfirmedPlayersCount] = useState(0);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showClearButton, setShowClearButton] = useState(false);
  const [isClearButtonEnabled, setIsClearButtonEnabled] = useState(false);

  const clearConfirmedPlayers = useCallback(async (groupId: string) => {
    try {
      const confirmedPlayersRef = collection(firestore, `groups/${groupId}/jogadoresConfirmados`);
      const snapshot = await getDocs(confirmedPlayersRef);
      if (snapshot.empty) return;

      const batch = writeBatch(firestore);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log("Lista de jogadores confirmados foi limpa.");
      setShowClearButton(false); // Hide button after clearing
       toast({
        variant: "success",
        title: "Lista Limpa!",
        description: "A lista de presença foi zerada para o próximo jogo."
      });
    } catch (error) {
      console.error("Erro ao limpar lista de confirmados:", error);
      toast({
        variant: "destructive",
        title: "Erro de Sistema",
        description: "Não foi possível limpar a lista de presença anterior."
      });
    }
  }, [toast]);
  
  useEffect(() => {
    if (!user?.groupId || !groupSettings) {
      setIsGameDateLoading(false);
      return;
    }

    setIsGameDateLoading(true);
    if (groupSettings.gameDays) {
      const gameInfo: GameInfo | null = getActiveOrNextGame(groupSettings.gameDays);
      setNextGameDate(gameInfo ? gameInfo.startDate : null);

      if (gameInfo) {
        const now = new Date();
        const gracePeriodEnd = new Date(gameInfo.endDate.getTime() + 24 * 60 * 60 * 1000);
        
        setIsGameFinished(now > gameInfo.endDate);
        setIsConfirmationLocked(now > gracePeriodEnd);

        const isManager = user.userType === UserType.GESTOR_GRUPO;
        setShowClearButton(isManager && confirmedPlayersCount > 0);
        setIsClearButtonEnabled(isManager && now > gameInfo.endDate);
        
      } else {
        setShowClearButton(false);
        setIsClearButtonEnabled(false);
      }
    } else {
      setNextGameDate(null);
    }
    setIsGameDateLoading(false);
  }, [user, groupSettings, confirmedPlayersCount]);

  useEffect(() => {
    if (!user?.groupId) {
        setConfirmedPlayers([]);
        setConfirmedPlayersCount(0);
        setIsFetchingPlayers(false);
        return;
    }

    setIsFetchingPlayers(true);
    const attendeesQuery = query(
        collection(firestore, `groups/${user.groupId}/jogadoresConfirmados`),
        where("status", "==", "confirmed")
    );
    
    const unsubscribe = onSnapshot(attendeesQuery, (snapshot) => {
        const playersData = snapshot.docs.map(doc => doc.data() as User);
        setConfirmedPlayers(playersData);
        setConfirmedPlayersCount(snapshot.size);
        setIsFetchingPlayers(false);
    }, (error) => {
      console.error("Error fetching confirmed players:", error);
      setConfirmedPlayers([]);
      setConfirmedPlayersCount(0);
      setIsFetchingPlayers(false);
    });

    return () => unsubscribe();
  }, [user?.groupId]);

  useEffect(() => {
    if (!user?.uid || !user?.groupId) {
        setConfirmedStatus(null);
        return;
    }

    const attendeeDocRef = doc(firestore, `groups/${user.groupId}/jogadoresConfirmados`, user.uid);
    
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
  }, [user?.uid, user?.groupId]);


  const handlePresenceClick = async (status: 'confirmed' | 'declined') => {
    if (!user || !user.groupId || !nextGameDate || isConfirmationLocked) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: isConfirmationLocked ? "O período de confirmação para este jogo já encerrou." : "Não foi possível registrar sua presença.",
      });
      return;
    }

    if (new Date() > nextGameDate) {
        toast({
            variant: "destructive",
            title: "Tempo Esgotado",
            description: "O horário para confirmar presença neste jogo já passou.",
        });
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
    
    // Set the status optimistically. This will immediately disable the correct button.
    setConfirmedStatus(status); 
    
    const attendeeDocRef = doc(firestore, `groups/${user.groupId}/jogadoresConfirmados`, user.uid);
    
    try {
      if (status === 'declined') {
        // If declining, we just delete the document. The listener will then set status to null.
        await deleteDoc(attendeeDocRef);
      } else {
        // If confirming, we set the document.
        await setDoc(attendeeDocRef, {
            status: status,
            confirmedAt: new Date().toISOString(),
            displayName: user.displayName,
            photoURL: user.photoURL,
            uid: user.uid,
        }, { merge: true });
      }

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
        // On error, revert the optimistic update to the previous state.
        setConfirmedStatus(oldStatus);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleClearConfirmedPlayers = () => {
    if (user?.groupId) {
      clearConfirmedPlayers(user.groupId);
    }
  };

  return {
    nextGameDate,
    isGameDateLoading,
    isGameFinished,
    isConfirmationLocked,
    confirmedStatus,
    confirmedPlayers,
    confirmedPlayersCount,
    isFetchingPlayers,
    isSubmitting,
    showClearButton,
    isClearButtonEnabled,
    handlePresenceClick,
    handleClearConfirmedPlayers,
  };
}
