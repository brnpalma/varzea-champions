
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { doc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { User, GroupSettings } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getActiveOrNextGame, GameInfo } from "@/lib/game-utils";

export function useEquipmentManager(user: User | null, groupSettings: GroupSettings | null, nextGameDate: Date | null) {
  const { toast } = useToast();
  const [equipmentManager, setEquipmentManager] = useState<{ next: User | null }>({ next: null });
  const [isLoadingManager, setIsLoadingManager] = useState(false);
  const lastRotatedGameIdRef = useRef<string | null>(null);

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
            // Se todos já lavaram, o último da lista (antes de resetar) é o 'current'
            currentManager = allPlayers[allPlayers.length - 1]; 
        }

        if (!currentManager) return;

        const batch = writeBatch(firestore);
        
        const currentManagerRef = doc(firestore, 'users', currentManager.uid);
        batch.update(currentManagerRef, { lavouColete: true });
        
        // Verifica se TODOS os jogadores (exceto o atual que acabamos de marcar) já lavaram
        const allHaveWashed = allPlayers.every(p => p.lavouColete || p.uid === currentManager.uid);

        if (allHaveWashed) {
            // Se todos já lavaram, reseta o status de todos (exceto o que acabou de lavar)
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
        fetchEquipmentManager(); // Re-fetch to update the UI
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
    if (!groupSettings?.gameDays || !user?.groupId) return;

    const gameInfo: GameInfo | null = getActiveOrNextGame(groupSettings.gameDays);
    if (!gameInfo) return;

    const now = new Date();
    const gameHasPassed = now > gameInfo.endDate;
    const gracePeriodEnd = new Date(gameInfo.endDate.getTime() + 24 * 60 * 60 * 1000);
    const gameId = `${gameInfo.startDate.getFullYear()}-${gameInfo.startDate.getMonth()}-${gameInfo.startDate.getDate()}`;
    
    // Se o período de graça terminou e ainda não rotacionamos para este jogo
    if (now > gracePeriodEnd && lastRotatedGameIdRef.current !== gameId) {
        updateEquipmentManagerRotation();
        lastRotatedGameIdRef.current = gameId; // Marca que a rotação para este jogo foi feita
    } else if (lastRotatedGameIdRef.current === null && !gameHasPassed) {
        // Na primeira vez que carrega, se o jogo ainda não passou, define a referência para evitar rotações indevidas
        lastRotatedGameIdRef.current = gameId;
    }

  }, [groupSettings, nextGameDate, updateEquipmentManagerRotation, user?.groupId]);

  return {
    equipmentManager,
    isLoadingManager,
  };
}
