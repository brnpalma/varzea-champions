
"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { User, GroupSettings } from "@/components/auth-provider";
import { formatDateToId, getActiveOrNextGame, GameInfo } from "@/lib/game-utils";
import { useToast } from "@/hooks/use-toast";

export function usePostGame(user: User | null, groupSettings: GroupSettings | null, nextGameDate: Date | null) {
  const { toast } = useToast();
  
  // Temporarily disable goals feature as it depends on the old 'attendees' collection
  const [goalsSubmitted, setGoalsSubmitted] = useState(true); 
  const [goalsCardState, setGoalsCardState] = useState({ visible: false, enabled: false, message: "A funcionalidade de registrar gols está sendo atualizada." });

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
    let message = "A funcionalidade de registrar gols está sendo atualizada.";

    if (gameHasPassed) {
        if (isWithinGracePeriod) {
            cardEnabled = false; // Always disabled for now
        } else {
            cardVisible = false; // Hide card if grace period is over
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
    // This functionality is temporarily disabled until it's refactored
    // to work with the new data structure without the 'attendees' collection.
    toast({
      variant: "destructive",
      title: "Função Indisponível",
      description: "O registro de gols está sendo atualizado e estará disponível em breve.",
    });
    return Promise.resolve();
  };

  return {
    goalsCardState,
    handleSaveGoals,
  };
}
