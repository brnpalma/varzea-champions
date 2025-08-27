
"use client";

import { User } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InviteCardProps {
    user: User | null;
    isManager: boolean;
}

export function InviteCard({ user, isManager }: InviteCardProps) {
    const { toast } = useToast();

    const handleShareLink = () => {
        if (!user || !isManager) return;
        const inviteLink = `${window.location.origin}/login?group_id=${user?.groupId}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
          toast({
            variant: 'success',
            title: 'Link Copiado!',
            description: 'O link de convite foi copiado para a sua área de transferência.',
          });
        }).catch(err => {
          console.error('Failed to copy text: ', err);
          toast({
            variant: 'destructive',
            title: 'Falha ao Copiar',
            description: 'Não foi possível copiar o link.',
          });
        });
    };

    return (
        <Card className="shadow-lg h-fit text-center">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3">
                <Share2 className="h-6 w-6 text-primary" />
                <span>Convidar Jogadores</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <Button onClick={handleShareLink}>
                <Share2 className="mr-2 h-4 w-4" />
                Copiar Link de Convite
              </Button>
            </CardContent>
        </Card>
    );
}

    