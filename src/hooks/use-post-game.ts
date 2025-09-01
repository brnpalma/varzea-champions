
"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { User, GroupSettings } from "@/components/auth-provider";
import { formatDateToId, getActiveOrNextGame, GameInfo } from "@/lib/game-utils";
import { useToast } from "@/hooks/use-toast";

export function usePostGame(user: User | null, groupSettings: GroupSettings | null, nextGameDate: Date | null) {
  const { toast } = useToast();
  const [goalsSubmitted, setGoalsSubmitted] = useState(false);
  const [goalsCardState, setGoalsCardState] = useState({ visible: false, enabled: false, message: "Aguarde o fim da partida para registrar seus gols." });

  // Effect to check if goals were already submitted for the current game
  useEffect(() => {
    if (!nextGameDate || !user?.uid || !user?.groupId) {
      setGoalsSubmitted(false);
      return;
    }

    // Since goals are tied to a game, we still need a gameId.
    const gameId = formatDateToId(nextGameDate);
    const gameGoalsDocRef = doc(firestore, `groups/${user.groupId}/games/${gameId}/attendees`, user.uid);
    
    const unsubscribe = onSnapshot(gameGoalsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Check if goals is a number and not null/undefined
        setGoalsSubmitted(typeof data.goals === 'number');
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
     if (!groupSettings?.gameDays || !nextGameDate) {
      setGoalsCardState({ visible: false, enabled: false, message: "Nenhuma partida agendada." });
      return;
    }
    
    const gameInfo: GameInfo | null = getActiveOrNextGame(groupSettings.gameDays);

    if (!gameInfo) {
      setGoalsCardState({ visible: false, enabled: false, message: "Nenhuma partida agendada." });
      return;
    }
    
    const now = new Date();
    const gameHasPassed = now > gameInfo.endDate;
    const gracePeriodEnd = new Date(gameInfo.endDate.getTime() + 24 * 60 * 60 * 1000);
    const isWithinGracePeriod = now > gameInfo.endDate && now < gracePeriodEnd;

    let cardEnabled = false;
    let cardVisible = true;
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
            cardVisible = false; // Hide card if grace period is over
            message = "O período para registrar gols encerrou.";
        }
    } else {
         cardEnabled = false;
         // Check if the game is happening right now
         if (now > gameInfo.startDate && now < gameInfo.endDate) {
           message = "Partida em andamento...";
         }
    }
    
    setGoalsCardState({ visible: cardVisible, enabled: cardEnabled, message });

  }, [nextGameDate, goalsSubmitted, groupSettings]);


  const handleSaveGoals = async (newGoals: number) => {
    if (!user || !user.groupId || !nextGameDate) {
      toast({ variant: "destructive", title: "Erro", description: "Dados do usuário ou do jogo não encontrados." });
      return;
    }
     const gameInfo: GameInfo | null = groupSettings?.gameDays ? getActiveOrNextGame(groupSettings.gameDays) : null;
    if (!gameInfo || new Date() < gameInfo.endDate) {
       toast({
        variant: "destructive",
        title: "Aguarde",
        description: "Você só pode registrar gols após o fim da partida.",
      });
      return;
    }

    const gameId = formatDateToId(nextGameDate);
    const gameGoalsDocRef = doc(firestore, `groups/${user.groupId}/games/${gameId}/attendees`, user.uid);
    const userDocRef = doc(firestore, "users", user.uid);

    try {
      await runTransaction(firestore, async (transaction) => {
        const gameGoalsDoc = await transaction.get(gameGoalsDocRef);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists()) {
          throw new Error("Documento do usuário não encontrado!");
        }

        const oldGoals = gameGoalsDoc.data()?.goals || 0;
        const goalsDifference = newGoals - oldGoals;
        
        const currentTotalGoals = userDoc.data()?.totalGoals || 0;
        const newTotalGoals = currentTotalGoals + goalsDifference;
        
        // We are creating a document in a collection that might not exist, which is fine.
        transaction.set(gameGoalsDocRef, { goals: newGoals, uid: user.uid }, { merge: true });
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
