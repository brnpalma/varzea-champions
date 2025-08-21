
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User } from "@/hooks/use-auth";
import { Users } from "lucide-react";
import { FootballSpinner } from "./ui/football-spinner";
import { UserAvatar } from "./user-avatar";

interface ConfirmedPlayersDialogProps {
  confirmedPlayers: User[];
  isFetchingPlayers: boolean;
}

export function ConfirmedPlayersDialog({ confirmedPlayers, isFetchingPlayers }: ConfirmedPlayersDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="lg" 
          disabled={isFetchingPlayers}
        >
          <Users className="mr-2 h-5 w-5" />
          {isFetchingPlayers ? (
            "Carregando..."
          ) : (
            <>
              {confirmedPlayers.length} Jogadores Confirmados
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Jogadores Confirmados ({confirmedPlayers.length})</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {isFetchingPlayers ? (
            <div className="flex justify-center items-center py-8">
              <FootballSpinner />
            </div>
          ) : confirmedPlayers.length > 0 ? (
            <ul className="space-y-3">
              {confirmedPlayers.map(player => (
                <li key={player.uid} className="flex items-center gap-3">
                  <UserAvatar src={player.photoURL} size={40} />
                  <span className="font-medium">{player.displayName}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhum jogador confirmado ainda.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
