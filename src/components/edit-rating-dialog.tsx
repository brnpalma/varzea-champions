
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
import { Star } from "lucide-react";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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
              <Select value={rating.toString()} onValueChange={(value) => setRating(Number(value))}>
                <SelectTrigger id="rating">
                  <SelectValue placeholder="Selecione a classificação" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map(r => (
                    <SelectItem key={r} value={r.toString()}>
                      <div className="flex items-center gap-2">
                        {r}
                        <div className="flex items-center">
                            {[...Array(r)].map((_, i) => <Star key={`filled-${i}`} className="h-4 w-4 text-amber-500 fill-current" />)}
                            {[...Array(5-r)].map((_, i) => <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground/30" />)}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

