
"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { User } from "@/components/auth-provider";
import { formatDateToId } from "@/lib/game-utils";
import { useToast } from "@/hooks/use-toast";

export function usePostGame(user: User | null, nextGameDate: Date | null) {
  const { toast } = useToast();
  const [goalsSubmitted, setGoalsSubmitted] = useState(false);
  const [goalsCardState, setGoalsCardState] = useState({ visible: false, enabled: false, message: "Aguarde o fim da partida para registrar seus gols." });

  // Effect to check if goals were already submitted for the current game
  useEffect(() => {
    if (!nextGameDate || !user?.uid || !user?.groupId) {
      setGoalsSubmitted(false);
      return;
    }

    const gameId = formatDateToId(nextGameDate);
    const attendeeDocRef = doc(firestore, `groups/${user.groupId}/games/${gameId}/attendees`, user.uid);
    
    const unsubscribe = onSnapshot(attendeeDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGoalsSubmitted(data.goals !== null && data.goals !== undefined);
      } else {
        setGoalsSubmitted(false);
      }
    }, (error) => {
      console.error("Error checking goals submission:", error);
      setGoalsSubmitted(false);
    });

    return () => unsubscribe();
  }, [nextGameDate, user?.uid, user?.groupId]);

  // Effect to update the state of the post-game card
  useEffect(() => {
    if (!nextGameDate) {
      setGoalsCardState({ visible: false, enabled: false, message: "Nenhuma partida agendada." });
      return;
    }
    
    const now = new Date();
    const gameHasPassed = now > nextGameDate;
    const gracePeriodEnd = new Date(nextGameDate.getTime() + 24 * 60 * 60 * 1000);
    const isWithinGracePeriod = now > nextGameDate && now < gracePeriodEnd;

    let cardEnabled = false;
    let cardVisible = true; // Card is always visible now
    let message = "Aguarde o fim da partida para registrar seus gols.";

    if (gameHasPassed) {
        if (isWithinGracePeriod) {
            if (goalsSubmitted) {
                cardEnabled = false;
                message = "Você já registrou seus gols para esta partida.";
            } else {
                cardEnabled = true;
                message = "A partida terminou! Registre seus gols.";
            }
        } else {
            cardEnabled = false;
            message = "O período para registrar gols encerrou.";
        }
    } else {
         cardEnabled = false;
    }
    
    setGoalsCardState({ visible: cardVisible, enabled: cardEnabled, message });

  }, [nextGameDate, goalsSubmitted]);


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

  return {
    goalsCardState,
    handleSaveGoals,
  };
}
