
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/hooks/use-auth";
import { FootballSpinner } from "../ui/football-spinner";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Badge } from "../ui/badge";
import plansConfig from '@/config/plans.json';

interface SubscriptionDialogProps {
  user: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function SubscriptionDialog({ user, isOpen, setIsOpen }: SubscriptionDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'annual'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedPlanId('annual'); // Reset plan when closing
    }
    setIsOpen(open);
  };
  
  const monthlyPlan = plansConfig.plans.monthly;
  const annualPlan = plansConfig.plans.annual;
  const selectedPlan = selectedPlanId === 'annual' ? annualPlan : monthlyPlan;

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
        if (selectedPlan.id === 'annual') {
          dataVencimento.setDate(currentDate.getDate() + 365);
        } else {
          dataVencimento.setDate(currentDate.getDate() + 30);
        }

        await setDoc(subscriptionRef, {
          plano: selectedPlan.name,
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
        setSelectedPlanId('annual');
      }
    }, 5000); // 5-second delay
  };

  const totalMonthlyForYear = monthlyPlan.price * 12;
  const yearlySavings = totalMonthlyForYear - annualPlan.price;
  const savingsPercentage = Math.round((yearlySavings / totalMonthlyForYear) * 100);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[90vh]">
            <DialogHeader className="text-center items-center p-6 pb-0">
                <div className="p-3 rounded-full bg-primary/20 text-primary">
                  <Crown className="h-8 w-8" />
                </div>
                <DialogTitle className="text-2xl">
                    Seja um Assinante
                </DialogTitle>
            </DialogHeader>
          
            <div className="flex-1 flex flex-col px-6 overflow-y-hidden">
                <div className="w-full bg-muted p-1 rounded-full flex items-center justify-center relative mt-4">
                    <div
                    className={cn(
                        "absolute left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-primary rounded-full transition-transform duration-300 ease-in-out",
                        selectedPlanId === "annual" && "translate-x-full"
                    )}
                    />
                    <button
                    type="button"
                    onClick={() => setSelectedPlanId("monthly")}
                    className={cn(
                        "w-1/2 z-10 py-2 rounded-full text-sm font-semibold transition-colors",
                        selectedPlanId === "monthly" ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                    >
                    Mensal
                    </button>
                    <button
                    type="button"
                    onClick={() => setSelectedPlanId("annual")}
                    className={cn(
                        "w-1/2 z-10 py-2 rounded-full text-sm font-semibold transition-colors",
                        selectedPlanId === "annual" ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                    >
                    Anual
                    </button>
                </div>
                
                <div className="text-center space-y-2 py-4">
                    {selectedPlanId === 'annual' && (
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
                    R$ {selectedPlan.price.toFixed(2).replace('.', ',')}
                    <span className="text-base font-medium text-muted-foreground"> / {selectedPlan.period}</span>
                    </p>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                    <p className="text-sm text-muted-foreground text-left">
                        {plansConfig.description}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{plansConfig.benefitsTitle}</p>
                    <ul className="space-y-2">
                    {plansConfig.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                        <BadgeCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                        </li>
                    ))}
                    </ul>
                </div>
            </div>
          
          <DialogFooter className="p-6 mt-auto">
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
            </DialogHeader>
            <div className="flex items-center justify-center p-8">
                <FootballSpinner />
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

    