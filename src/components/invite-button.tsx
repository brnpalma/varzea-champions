
"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, UserType } from "@/hooks/use-auth";
import { Copy } from "lucide-react";

interface InviteButtonProps extends ButtonProps {
  user: User | null;
}

export function InviteButton({ user, className, ...props }: InviteButtonProps) {
  const { toast } = useToast();

  const handleShareLink = () => {
    if (!user?.groupId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível gerar o link de convite. ID do grupo não encontrado.',
      });
      return;
    }
    const inviteLink = `${window.location.origin}/login?group_id=${user.groupId}`;
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

  if (!user || user.userType !== UserType.GESTOR_GRUPO) {
    return null;
  }

  return (
    <Button onClick={handleShareLink} className={className} {...props}>
      <Copy className="mr-2 h-4 w-4" />
      Copiar link para novos jogadores
    </Button>
  );
}
