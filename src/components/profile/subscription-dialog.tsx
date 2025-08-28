
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
import { BadgeCheck, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/hooks/use-auth";
import { FootballSpinner } from "../ui/football-spinner";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";

interface SubscriptionDialogProps {
  user: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function SubscriptionDialog({ user, isOpen, setIsOpen }: SubscriptionDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<'Mensal' | 'Anual'>('Anual');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedPlan('Anual'); // Reset plan when closing
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
        setSelectedPlan('Anual');
      }
    }, 5000); // 5-second delay
  };

  const plans = {
    Mensal: { price: 15.00, period: "mês" },
    Anual: { price: 30.00, period: "ano" },
  }

  const benefits = [
    "Gestão Financeira Detalhada",
    "Histórico e Estatísticas",
    "Controle de Equipamentos Automático",
    "Comunicação Simplificada com o Grupo",
    "Cadastro Ilimitado de Jogadores",
  ]

  const totalMonthlyForYear = plans.Mensal.price * 12;
  const yearlySavings = totalMonthlyForYear - plans.Anual.price;
  const savingsPercentage = Math.round((yearlySavings / totalMonthlyForYear) * 100);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[90vh]">
            <DialogHeader className="text-center items-center p-6 pb-0">
                <div className="p-3 rounded-full bg-primary/20 text-primary mb-2">
                <Crown className="h-8 w-8" />
                </div>
            <DialogTitle className="text-2xl">
                Seja um Assinante
            </DialogTitle>
            <DialogDescription className="text-left">
                Desbloqueie funcionalidades exclusivas para uma gestão completa e profissional do seu grupo.
            </DialogDescription>
            </DialogHeader>
          
          <ScrollArea className="flex-1">
            <div className="p-6 pt-4">
              <div className="space-y-6">
                <div className="w-full bg-muted p-1 rounded-full flex items-center justify-center relative">
                  <div
                    className={cn(
                      "absolute left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-primary rounded-full transition-transform duration-300 ease-in-out",
                      selectedPlan === "Anual" && "translate-x-full"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("Mensal")}
                    className={cn(
                      "w-1/2 z-10 py-2 rounded-full text-sm font-semibold transition-colors",
                      selectedPlan === "Mensal" ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("Anual")}
                    className={cn(
                      "w-1/2 z-10 py-2 rounded-full text-sm font-semibold transition-colors",
                      selectedPlan === "Anual" ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    Anual
                  </button>
                </div>

                <div className="text-center space-y-2">
                  {selectedPlan === 'Anual' && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">
                        De R$ {totalMonthlyForYear.toFixed(2).replace('.', ',')}
                      </span>
                      <Badge className="bg-amber-500/20 text-amber-600 font-bold">
                        Economize {savingsPercentage}%
                      </Badge>
                    </div>
                  )}
                  <p className="text-4xl font-bold">
                    R$ {plans[selectedPlan].price.toFixed(2).replace('.', ',')}
                    <span className="text-base font-medium text-muted-foreground"> / {plans[selectedPlan].period}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Recursos Premium:</p>
                  <ul className="space-y-2">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <BadgeCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-6 mt-auto border-t">
            <Button onClick={handlePayment} size="lg" className="w-full">
              Assinar Plano
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
