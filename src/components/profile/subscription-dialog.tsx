
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SubscriptionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function SubscriptionDialog({ isOpen, setIsOpen }: SubscriptionDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly' | null>(null);

  const paymentLinks = {
    annual: "https://google.com.br", // Placeholder
    monthly: "https://google.com.br", // Placeholder
  };

  const handleSelectPlan = (plan: 'annual' | 'monthly') => {
    setSelectedPlan(plan);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedPlan(null); // Reset plan when closing
    }
    setIsOpen(open);
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="text-left p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-6 w-6 text-primary" />
            Seja um Assinante
          </DialogTitle>
        </DialogHeader>
        <div className="px-6">
            <div className="max-h-48 overflow-y-auto space-y-2">
                <DialogDescription className="text-left text-sm">
                    Ao se tornar assinante, você desbloqueia funcionalidades exclusivas para uma gestão completa e profissional do seu grupo:
                </DialogDescription>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground text-left">
                <li>
                    <strong>Gestão Financeira Detalhada:</strong> Acompanhe pagamentos, pendências e a saúde financeira do time.
                </li>
                <li>
                    <strong>Histórico e Estatísticas:</strong> Acesse o histórico de partidas e estatísticas avançadas de desempenho.
                </li>
                <li>
                    <strong>Controle de Equipamentos:</strong> Gerencie o rodízio de limpeza de coletes e uniformes de forma automática.
                </li>
                <li>
                    <strong>Comunicação Simplificada:</strong> Envie lembretes e comunicados importantes para os jogadores.
                </li>
                <li>
                    <strong>Cadastro Ilimitado:</strong> Cadastre mais de 10 jogadores no seu grupo.
                </li>
                </ul>
            </div>
        </div>


        <div className="grid gap-4 px-6 py-2">
          <Button
            size="lg"
            variant={selectedPlan === 'annual' ? 'default' : 'secondary'}
            onClick={() => handleSelectPlan('annual')}
            className="h-auto py-3 justify-between"
          >
            <div className="text-left">
              <p className="font-bold">Plano Anual</p>
              <p className="text-sm font-normal">R$ 30,00 por ano</p>
            </div>
          </Button>
          <Button
            size="lg"
            variant={selectedPlan === 'monthly' ? 'default' : 'secondary'}
            onClick={() => handleSelectPlan('monthly')}
            className="h-auto py-3 justify-between"
          >
            <div className="text-left">
              <p className="font-bold">Plano Mensal</p>
              <p className="text-sm font-normal">R$ 15,00 por mês</p>
            </div>
          </Button>
        </div>
        
        <DialogFooter className="sm:justify-end gap-2 p-6 bg-secondary/50 rounded-b-lg">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">Fechar</Button>
          </DialogClose>
          <Button disabled={!selectedPlan} className="w-full sm:w-auto">
            Ir para Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
