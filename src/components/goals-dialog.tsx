
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Goal } from "lucide-react";

interface GoalsDialogProps {
  onSave: (goals: number) => Promise<void>;
  isDisabled: boolean;
}

export function GoalsDialog({ onSave, isDisabled }: GoalsDialogProps) {
  const [goals, setGoals] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = async () => {
    setIsSaving(true);
    await onSave(goals);
    setIsSaving(false);
    setIsOpen(false); // Close the dialog on successful save
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" disabled={isDisabled}>
          <Goal className="mr-2 h-5 w-5" />
          Registrar Gols
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Gols</DialogTitle>
          <DialogDescription>
            Informe quantos gols você marcou na partida de hoje.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goals" className="text-right">
              Gols
            </Label>
            <Input
              id="goals"
              type="number"
              value={goals}
              onChange={(e) => setGoals(Math.max(0, parseInt(e.target.value) || 0))}
              className="col-span-3"
              min="0"
            />
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
