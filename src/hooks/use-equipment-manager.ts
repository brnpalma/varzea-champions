
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { doc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { User, GroupSettings } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { formatDateToId } from "@/lib/game-utils";

export function useEquipmentManager(user: User | null, groupSettings: GroupSettings | null, nextGameDate: Date | null) {
  const { toast } = useToast();
  const [equipmentManager, setEquipmentManager] = useState<{ next: User | null }>({ next: null });
  const [isLoadingManager, setIsLoadingManager] = useState(false);
  const previousGameDateRef = useRef<string | null>(null);

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
    const currentGameId = nextGameDate ? formatDateToId(nextGameDate) : null;
    
    if (previousGameDateRef.current && currentGameId && previousGameDateRef.current !== currentGameId) {
        const previousDate = new Date(previousGameDateRef.current);
        const now = new Date();
        if (nextGameDate && previousDate < now && nextGameDate > now) {
          updateEquipmentManagerRotation();
        }
    }
    previousGameDateRef.current = currentGameId;
  }, [nextGameDate, updateEquipmentManagerRotation]);

  return {
    equipmentManager,
    isLoadingManager,
  };
}
