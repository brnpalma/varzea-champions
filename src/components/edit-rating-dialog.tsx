
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { User } from "@/hooks/use-auth";
import { Label } from "./ui/label";
import { RatingSelect } from "./rating-select";

interface EditRatingDialogProps {
  player: User;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (newRating: number) => Promise<void>;
}

export function EditRatingDialog({ player, isOpen, onOpenChange, onSave }: EditRatingDialogProps) {
  const [rating, setRating] = useState(player.rating || 1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(player.rating || 1);
    }
  }, [isOpen, player.rating]);

  const handleSaveClick = async () => {
    setIsSaving(true);
    await onSave(rating);
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Estrelas</DialogTitle>
          <DialogDescription>
            Altere a classificação de {player.displayName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rating" className="text-right">
              Estrelas
            </Label>
            <div className="col-span-3">
              <RatingSelect
                id="rating"
                value={rating}
                onValueChange={setRating}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSaveClick} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
