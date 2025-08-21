
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
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
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

const formatDateToId = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
}

export function SorterConfirmationDialog({ isOpen, setIsOpen, onConfirm, groupId, nextGameDate }: SorterConfirmationDialogProps) {
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playerStatus, setPlayerStatus] = useState<Record<string, boolean>>({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Track UID of player being updated
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !groupId) return;

    setIsLoading(true);
    const playersQuery = query(
      collection(firestore, 'users'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }) as User);
      setAllPlayers(playersData.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')));
      
      if (nextGameDate) {
        const gameId = formatDateToId(nextGameDate);
        const attendeesQuery = query(
          collection(firestore, `groups/${groupId}/games/${gameId}/attendees`),
          where("status", "==", "confirmed")
        );
        
        const unsubAttendees = onSnapshot(attendeesQuery, (attendeesSnapshot) => {
            const confirmedIds = new Set(attendeesSnapshot.docs.map(doc => doc.id));
            const initialStatus: Record<string, boolean> = {};
            playersData.forEach(p => {
                initialStatus[p.uid] = confirmedIds.has(p.uid);
            });
            setPlayerStatus(initialStatus);
            setIsLoading(false);
        }, (error) => {
             console.error("Error fetching attendees:", error);
             setIsLoading(false);
        });
        return () => unsubAttendees();
      } else {
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Error fetching all players:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, groupId, nextGameDate]);

  const { confirmed, notConfirmed } = useMemo(() => {
    const confirmed: User[] = [];
    const notConfirmed: User[] = [];
    allPlayers.forEach(player => {
      if (playerStatus[player.uid]) {
        confirmed.push(player);
      } else {
        notConfirmed.push(player);
      }
    });
    return { confirmed, notConfirmed };
  }, [allPlayers, playerStatus]);

  const handleStatusChange = async (player: User, newStatus: boolean) => {
    if (!nextGameDate) {
        toast({ variant: "destructive", title: "Erro", description: "Data do jogo não encontrada."});
        return;
    }

    setIsUpdating(player.uid);
    // Optimistic update
    setPlayerStatus(prev => ({ ...prev, [player.uid]: newStatus }));

    const gameId = formatDateToId(nextGameDate);
    const attendeeDocRef = doc(firestore, `groups/${groupId}/games/${gameId}/attendees`, player.uid);

    try {
        await setDoc(attendeeDocRef, {
            status: newStatus ? 'confirmed' : 'declined',
            confirmedAt: new Date().toISOString(),
            displayName: player.displayName,
            photoURL: player.photoURL,
            uid: player.uid,
        }, { merge: true });
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
          <div className="flex items-center gap-3">
            <UserAvatar src={player.photoURL} size={32} />
            <span className="font-medium text-sm text-secondary-foreground">{player.displayName}</span>
          </div>
          <Switch
            checked={playerStatus[player.uid]}
            onCheckedChange={(checked) => handleStatusChange(player, checked)}
            disabled={isUpdating === player.uid}
            aria-label={`Presença de ${player.displayName}`}
          />
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
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            Confirmados ({confirmed.length})
                        </h3>
                        <span className="text-xs font-semibold text-muted-foreground">Incluir</span>
                    </div>
                    {confirmed.length > 0 ? renderPlayerList(confirmed) : <p className="text-xs text-muted-foreground pt-2">Nenhum jogador confirmado.</p>}
                  </div>
                   <div>
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            Não Confirmados ({notConfirmed.length})
                        </h3>
                        <span className="text-xs font-semibold text-muted-foreground">Incluir</span>
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
