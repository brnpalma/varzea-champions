
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
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FootballSpinner } from "./ui/football-spinner";
import { UserAvatar } from "./user-avatar";
import { ScrollArea } from "./ui/scroll-area";
import { CheckCircle2, XCircle } from "lucide-react";

interface SorterConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onConfirm: () => void;
  groupId: string;
  confirmedPlayerIds: string[];
}

export function SorterConfirmationDialog({ isOpen, setIsOpen, onConfirm, groupId, confirmedPlayerIds }: SorterConfirmationDialogProps) {
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !groupId) return;

    setIsLoading(true);
    const playersQuery = query(
      collection(firestore, 'users'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
      const playersData = snapshot.docs.map(doc => doc.data() as User);
      setAllPlayers(playersData.sort((a, b) => a.displayName!.localeCompare(b.displayName!)));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching all players:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, groupId]);

  const { confirmed, notConfirmed } = useMemo(() => {
    const confirmedSet = new Set(confirmedPlayerIds);
    const confirmed: User[] = [];
    const notConfirmed: User[] = [];

    allPlayers.forEach(player => {
      if (confirmedSet.has(player.uid)) {
        confirmed.push(player);
      } else {
        notConfirmed.push(player);
      }
    });
    return { confirmed, notConfirmed };
  }, [allPlayers, confirmedPlayerIds]);

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  const renderPlayerList = (players: User[]) => (
    <ul className="space-y-2 pt-2">
      {players.map(player => (
        <li key={player.uid} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30">
          <UserAvatar src={player.photoURL} size={32} />
          <span className="font-medium text-sm text-secondary-foreground">{player.displayName}</span>
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
            Confira a lista de jogadores antes de sortear os times.
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
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        Confirmados ({confirmed.length})
                    </h3>
                    {confirmed.length > 0 ? renderPlayerList(confirmed) : <p className="text-xs text-muted-foreground pt-2">Nenhum jogador confirmado.</p>}
                  </div>
                   <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        Não Confirmados ({notConfirmed.length})
                    </h3>
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
            Sortear Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
