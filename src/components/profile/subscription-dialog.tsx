
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
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/hooks/use-auth";
import { FootballSpinner } from "../ui/football-spinner";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface SubscriptionDialogProps {
  user: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function SubscriptionDialog({ user, isOpen, setIsOpen }: SubscriptionDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<'Anual' | 'Mensal' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedPlan(null); // Reset plan when closing
    }
    setIsOpen(open);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !user?.email) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um plano e certifique-se de que está logado.",
      });
      return;
    }

    setIsOpen(false);
    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const subscriptionRef = doc(firestore, "assinaturas", user.email!);
        
        const currentDate = new Date();
        const dataVencimento = new Date(currentDate);
        if (selectedPlan === 'Anual') {
          dataVencimento.setDate(currentDate.getDate() + 365);
        } else {
          dataVencimento.setDate(currentDate.getDate() + 30);
        }

        await setDoc(subscriptionRef, {
          plano: selectedPlan,
          dataInicio: currentDate,
          dataVencimento: dataVencimento,
          userId: user.uid,
        }, { merge: true });

        toast({
          variant: "success",
          title: "Pagamento Aprovado!",
          description: "Sua assinatura foi ativada com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao atualizar assinatura:", error);
        toast({
          variant: "destructive",
          title: "Erro no Pagamento",
          description: "Não foi possível processar sua assinatura. Tente novamente.",
        });
      } finally {
        setIsProcessing(false);
        setSelectedPlan(null);
      }
    }, 5000); // 5-second delay
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl p-0">
          <DialogHeader className="text-left p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="h-6 w-6 text-primary" />
              Seja um Assinante
            </DialogTitle>
          </DialogHeader>
          <div className="px-6">
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
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

          <div className="grid grid-cols-2 gap-4 px-6 py-2">
              <div
                onClick={() => setSelectedPlan('Anual')}
                className={cn(
                    "cursor-pointer rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-all overflow-hidden",
                    selectedPlan === 'Anual' ? 'border-primary ring-2 ring-primary' : 'border-border'
                )}
              >
                  <div className="bg-blue-600 text-white p-2 text-center font-bold">
                      Plano Anual
                  </div>
                  <div className="p-4 space-y-2 text-center">
                      <p className="text-xs text-muted-foreground h-16">
                          Com apenas 1 pagamento de R$ 30,00, tenha tudo liberado por 12 meses.
                      </p>
                      <p className="text-2xl font-bold">R$ 30,00</p>
                      <p className="text-xs font-semibold text-muted-foreground">por ano</p>
                  </div>
              </div>
               <div
                onClick={() => setSelectedPlan('Mensal')}
                className={cn(
                    "cursor-pointer rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-all overflow-hidden",
                    selectedPlan === 'Mensal' ? 'border-primary ring-2 ring-primary' : 'border-border'
                )}
              >
                  <div className="bg-orange-500 text-white p-2 text-center font-bold">
                      Plano Mensal
                  </div>
                   <div className="p-4 space-y-2 text-center">
                      <p className="text-xs text-muted-foreground h-16">
                          Acesso a todos os recursos com uma pequena taxa recorrente.
                      </p>
                      <p className="text-2xl font-bold">R$ 15,00</p>
                      <p className="text-xs font-semibold text-muted-foreground">por mês</p>
                  </div>
              </div>
          </div>
          
          <DialogFooter className="sm:justify-end gap-2 p-6 bg-secondary/50 rounded-b-lg">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">Fechar</Button>
            </DialogClose>
            <Button onClick={handlePayment} disabled={!selectedPlan} className="w-full sm:w-auto">
              Ir para Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isProcessing}>
        <DialogContent className="sm:max-w-sm" hideCloseButton>
            <DialogHeader>
                <DialogTitle className="text-center">Processando Pagamento</DialogTitle>
                <DialogDescription className="text-center pt-4">
                    Aguarde um momento, estamos confirmando sua assinatura.
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-8">
                <FootballSpinner />
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
