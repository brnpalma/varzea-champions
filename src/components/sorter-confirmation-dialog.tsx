
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { User } from "@/hooks/use-auth";
import { firestore } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { FootballSpinner } from "./ui/football-spinner";
import { UserAvatar } from "./user-avatar";
import { ScrollArea } from "./ui/scroll-area";
import { CheckCircle2, XCircle } from "lucide-react";
import { Switch } from "./ui/switch";
import { useToast } from "@/hooks/use-toast";

interface SorterConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onConfirm: (finalPlayerList: User[]) => void;
  groupId: string;
  nextGameDate: Date | null;
}

export function SorterConfirmationDialog({ isOpen, setIsOpen, onConfirm, groupId, nextGameDate }: SorterConfirmationDialogProps) {
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playerStatus, setPlayerStatus] = useState<Record<string, boolean>>({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !groupId) return;

    setIsLoading(true);
    // First, get all players of the group
    const playersQuery = query(
      collection(firestore, 'users'),
      where('groupId', '==', groupId)
    );

    const unsubscribePlayers = onSnapshot(playersQuery, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }) as User);
      setAllPlayers(playersData.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')));
      
      // Then, get the confirmed players for the next game
      const confirmedQuery = query(
        collection(firestore, `groups/${groupId}/jogadoresConfirmados`),
        where("status", "==", "confirmed")
      );
      
      const unsubscribeConfirmed = onSnapshot(confirmedQuery, (confirmedSnapshot) => {
          const confirmedIds = new Set(confirmedSnapshot.docs.map(doc => doc.id));
          const initialStatus: Record<string, boolean> = {};
          playersData.forEach(p => {
              initialStatus[p.uid] = confirmedIds.has(p.uid);
          });
          setPlayerStatus(initialStatus);
          setIsLoading(false);
      }, (error) => {
           console.error("Error fetching confirmed players:", error);
           setIsLoading(false);
      });
      
      return () => unsubscribeConfirmed();
    }, (error) => {
      console.error("Error fetching all players:", error);
      setIsLoading(false);
    });

    return () => unsubscribePlayers();
  }, [isOpen, groupId]);

  const { confirmed, notConfirmed } = useMemo(() => {
    const confirmedList: User[] = [];
    const notConfirmedList: User[] = [];
    allPlayers.forEach(player => {
      if (playerStatus[player.uid]) {
        confirmedList.push(player);
      } else {
        notConfirmedList.push(player);
      }
    });
    return { confirmed: confirmedList, notConfirmed: notConfirmedList };
  }, [allPlayers, playerStatus]);

  const handleStatusChange = async (player: User, newStatus: boolean) => {
    if (!nextGameDate) {
        toast({ variant: "destructive", title: "Erro", description: "Data do jogo não encontrada."});
        return;
    }

    setIsUpdating(player.uid);
    // Optimistic update
    setPlayerStatus(prev => ({ ...prev, [player.uid]: newStatus }));

    const confirmedDocRef = doc(firestore, `groups/${groupId}/jogadoresConfirmados`, player.uid);

    try {
      if (newStatus) {
        await setDoc(confirmedDocRef, {
            status: 'confirmed',
            confirmedAt: new Date().toISOString(),
            displayName: player.displayName,
            photoURL: player.photoURL,
            uid: player.uid,
        }, { merge: true });
      } else {
        await deleteDoc(confirmedDocRef);
      }
    } catch (error) {
        console.error("Error updating presence:", error);
        toast({ variant: "destructive", title: "Erro ao atualizar", description: `Não foi possível alterar a presença de ${player.displayName}.`});
        // Revert on error
        setPlayerStatus(prev => ({ ...prev, [player.uid]: !newStatus }));
    } finally {
        setIsUpdating(null);
    }
  };


  const handleConfirm = () => {
    const finalPlayerList = allPlayers.filter(p => playerStatus[p.uid]);
    onConfirm(finalPlayerList);
    setIsOpen(false);
  };

  const renderPlayerList = (players: User[]) => (
    <ul className="space-y-2 pt-2">
      {players.map(player => (
        <li key={player.uid} className="flex items-center justify-between gap-3 p-2 rounded-md bg-secondary/30">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <UserAvatar src={player.photoURL} size={32} />
            <span className="font-medium text-sm text-secondary-foreground truncate">{player.displayName}</span>
          </div>
          <div className="w-auto">
            <Switch
              checked={playerStatus[player.uid] ?? false}
              onCheckedChange={(checked) => handleStatusChange(player, checked)}
              disabled={isUpdating === player.uid}
              aria-label={`Presença de ${player.displayName}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Sorteio</DialogTitle>
           <DialogDescription>
            Ajuste a lista de presença final. Ative ou desative os jogadores que realmente participarão da partida de hoje.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <FootballSpinner />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] rounded-md border p-4">
              <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="flex-1 font-semibold text-sm flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            Confirmados ({confirmed.length})
                        </h3>
                        <span className="text-xs font-semibold text-muted-foreground w-auto px-[13px]">Incluir</span>
                    </div>
                    {confirmed.length > 0 ? renderPlayerList(confirmed) : <p className="text-xs text-muted-foreground pt-2">Nenhum jogador confirmado.</p>}
                  </div>
                   <div>
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="flex-1 font-semibold text-sm flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            Não Confirmados ({notConfirmed.length})
                        </h3>
                         <span className="text-xs font-semibold text-muted-foreground w-auto px-[13px]">Incluir</span>
                    </div>
                     {notConfirmed.length > 0 ? renderPlayerList(notConfirmed) : <p className="text-xs text-muted-foreground pt-2">Todos os jogadores confirmaram.</p>}
                  </div>
              </div>
          </ScrollArea>
        )}
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isLoading || confirmed.length === 0}>
            Sortear Agora ({confirmed.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
