
"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { User, GroupSettings } from "@/components/auth-provider";
import { getActiveOrNextGame, GameInfo } from "@/lib/game-utils";
import { useToast } from "@/hooks/use-toast";

export function usePostGame(user: User | null, groupSettings: GroupSettings | null, nextGameDate: Date | null) {
  const { toast } = useToast();
  
  const [goalsSubmitted, setGoalsSubmitted] = useState(false); 
  const [goalsCardState, setGoalsCardState] = useState({ visible: false, enabled: false, message: "" });

  // Effect to check if user already submitted goals for the current/last game
  useEffect(() => {
    if (!user?.uid || !user.groupId || !nextGameDate) {
      setGoalsSubmitted(false);
      return;
    }

    const confirmedDocRef = doc(firestore, `groups/${user.groupId}/jogadoresConfirmados`, user.uid);
    const unsubscribe = onSnapshot(confirmedDocRef, (docSnap) => {
      // If the document exists and has a 'goals' field (not null/undefined), it means goals were submitted.
      setGoalsSubmitted(docSnap.exists() && docSnap.data().goals != null);
    });

    return () => unsubscribe();
  }, [user?.uid, user?.groupId, nextGameDate]);

  // Effect to update the state of the post-game card
  useEffect(() => {
     if (!user || !groupSettings?.gameDays || !nextGameDate) {
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
    let message = "";

    if (gameHasPassed) {
        if (isWithinGracePeriod) {
            if (goalsSubmitted) {
                cardEnabled = false;
                message = "Você já registrou seus gols!";
            } else {
                cardEnabled = true;
                message = "A partida acabou. Registre seus gols!";
            }
        } else {
            cardVisible = false; // Hide card if grace period is over
        }
    } else {
         cardEnabled = false;
         if (now > gameInfo.startDate && now < gameInfo.endDate) {
           message = "Partida em andamento...";
         } else {
           message = "Aguardando o início da partida.";
         }
    }
    
    setGoalsCardState({ visible: cardVisible, enabled: cardEnabled, message });

  }, [nextGameDate, goalsSubmitted, groupSettings, user]);


  const handleSaveGoals = async (newGoals: number) => {
    if (!user?.uid || !user.groupId) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não encontrado." });
      return;
    }
    
    const userDocRef = doc(firestore, "users", user.uid);
    const confirmedDocRef = doc(firestore, `groups/${user.groupId}/jogadoresConfirmados`, user.uid);

    try {
        await runTransaction(firestore, async (transaction) => {
            const confirmedDoc = await transaction.get(confirmedDocRef);
            if (!confirmedDoc.exists()) {
                throw new Error("Você precisa ter confirmado presença para registrar gols.");
            }

            // Mark goals as submitted in the confirmed player doc
            transaction.set(confirmedDocRef, { goals: newGoals }, { merge: true });

            // Update total goals in user's main profile document
            const userDoc = await transaction.get(userDocRef);
            const currentTotalGoals = userDoc.data()?.totalGoals || 0;
            transaction.update(userDocRef, { totalGoals: currentTotalGoals + newGoals });
        });

        toast({
            variant: "success",
            title: "Gols Salvos!",
            description: `${newGoals} gols foram adicionados ao seu perfil.`,
        });
    } catch (error: any) {
        console.error("Error saving goals:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: error.message || "Não foi possível registrar seus gols. Tente novamente.",
        });
    }
  };

  return {
    goalsCardState,
    handleSaveGoals,
  };
}
