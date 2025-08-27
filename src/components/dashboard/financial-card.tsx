
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { GroupSettings } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";

interface FinancialCardProps {
    groupSettings: GroupSettings;
}

export function FinancialCard({ groupSettings }: FinancialCardProps) {
    const { toast } = useToast();

    const handleCopyPix = () => {
        if (!groupSettings?.chavePix) return;
        navigator.clipboard.writeText(groupSettings.chavePix);
        toast({
            variant: "success",
            title: "Chave PIX Copiada!",
        });
    };

    return (
        <Card className="shadow-lg h-fit text-center">
            <CardHeader className="text-center">
              <CardTitle className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Wallet className="h-6 w-6 text-primary" />
                <span>Financeiro</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {groupSettings.chavePix && (
                <div className="pb-2">
                   <p className="text-sm text-muted-foreground mb-1">Chave PIX:</p>
                   <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary">
                       <code className="flex-1 break-all text-left">{groupSettings.chavePix}</code>
                       <Button variant="ghost" size="sm" onClick={handleCopyPix}>
                           Copiar
                       </Button>
                   </div>
                </div>
              )}
               {groupSettings.valorMensalidade && (
                   <div className="flex justify-between items-center">
                       <span className="text-muted-foreground">Mensalidade:</span>
                       <span className="font-bold text-lg">R$ {groupSettings.valorMensalidade.toFixed(2)}</span>
                   </div>
               )}
                {groupSettings.valorAvulso && (
                   <div className="flex justify-between items-center">
                       <span className="text-muted-foreground">Jogo Avulso:</span>
                       <span className="font-bold text-lg">R$ {groupSettings.valorAvulso.toFixed(2)}</span>
                   </div>
               )}
            </CardContent>
        </Card>
    );
}

    
