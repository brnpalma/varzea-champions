
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            <BadgeCheck className="h-6 w-6 text-primary" />
            Seja um Assinante
          </DialogTitle>
          <DialogDescription className="text-left">
            Ao se tornar assinante, você desbloqueia funcionalidades exclusivas para uma gestão completa e profissional do seu grupo:
          </DialogDescription>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-muted-foreground text-left">
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
          </ul>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
        
        <DialogFooter className="sm:justify-between gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">Fechar</Button>
          </DialogClose>
          <Button asChild disabled={!selectedPlan} className="w-full sm:w-auto">
            <Link href={selectedPlan ? paymentLinks[selectedPlan] : '#'} target="_blank">
              Ir para o Pagamento
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
