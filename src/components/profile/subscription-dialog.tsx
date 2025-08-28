
"use client";

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

interface SubscriptionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function SubscriptionDialog({ isOpen, setIsOpen }: SubscriptionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-6 w-6 text-primary" />
            Seja um Assinante
          </DialogTitle>
          <DialogDescription>
            Desbloqueie funcionalidades exclusivas, como gerenciamento financeiro avançado e sorteios de times ilimitados, e apoie a evolução contínua do nosso app.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button asChild size="lg" className="h-auto py-3">
            <Link href="https://google.com.br" target="_blank">
              <div className="flex justify-between items-center w-full">
                <div className="text-left">
                  <p className="font-bold">Plano Anual</p>
                  <p className="text-sm font-normal">R$ 30,00 por ano</p>
                </div>
                <ExternalLink className="h-5 w-5" />
              </div>
            </Link>
          </Button>
          <Button asChild size="lg" className="h-auto py-3" variant="secondary">
             <Link href="https://google.com.br" target="_blank">
               <div className="flex justify-between items-center w-full">
                <div className="text-left">
                  <p className="font-bold">Plano Mensal</p>
                  <p className="text-sm font-normal">R$ 15,00 por mês</p>
                </div>
                <ExternalLink className="h-5 w-5" />
              </div>
            </Link>
          </Button>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
