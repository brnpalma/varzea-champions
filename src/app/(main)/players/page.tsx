
"use client";

import { useEffect, useState, useTransition } from 'react';
import { useAuth, User, UserType } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { UserAvatar } from '@/components/user-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Trash2, LogIn, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { FootballSpinner } from '@/components/ui/football-spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function PlayersPage() {
  const { user, loading } from useAuth();
  const [players, setPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();


  const isManager = user?.userType === UserType.GESTOR_GRUPO;
  const groupId = user?.groupId;


  useEffect(() => {
    if (loading) return; 

    if (!groupId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const playersQuery = query(
      collection(firestore, 'users'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(playersQuery, (querySnapshot) => {
      const playersData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
      })) as User[];
      setPlayers(playersData.sort((a, b) => a.displayName!.localeCompare(b.displayName!)));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching players: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar jogadores',
        description: 'Não foi possível carregar a lista de jogadores.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, toast, loading]);

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

  const handleRemovePlayer = async (playerToRemove: User) => {
    if (!isManager || !playerToRemove) return;

    try {
      const playerDocRef = doc(firestore, "users", playerToRemove.uid);
      await updateDoc(playerDocRef, {
        groupId: null,
      });

      toast({
        variant: 'success',
        title: 'Jogador Removido',
        description: `${playerToRemove.displayName} foi removido do grupo.`,
      });
    } catch (error) {
       console.error("Error removing player: ", error);
       toast({
        variant: 'destructive',
        title: 'Erro ao Remover',
        description: 'Não foi possível remover o jogador.',
      });
    }
  };

  const handleToggleDebtPermission = (playerToUpdate: User) => {
    startTransition(async () => {
      if (!isManager || !playerToUpdate) return;
      
      const playerDocRef = doc(firestore, "users", playerToUpdate.uid);
      const newPermission = !(playerToUpdate.allowConfirmationWithDebt ?? false);

      try {
        await updateDoc(playerDocRef, {
          allowConfirmationWithDebt: newPermission
        });
        toast({
          variant: 'success',
          title: 'Permissão Atualizada',
          description: `A permissão para ${playerToUpdate.displayName} foi ${newPermission ? 'concedida' : 'revogada'}.`,
        });
      } catch (error) {
        console.error("Error updating permission: ", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao Atualizar',
          description: 'Não foi possível atualizar a permissão do jogador.',
        });
      }
    });
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center h-full">
        <FootballSpinner />
      </div>
    );
  }


  if (!user) {
     return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto shadow-lg text-center">
          <CardHeader>
            <CardTitle>Gerencie seu Grupo</CardTitle>
            <CardDescription>Faça login como Gestor de Grupo para adicionar e remover jogadores, ou como jogador para ver os membros do seu time.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild size="lg">
                <Link href="/login">
                  <LogIn className="mr-2" />
                  Fazer Login ou Criar Conta
                </Link>
              </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!groupId) {
     return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto shadow-lg text-center">
          <CardHeader>
            <CardTitle>Você não está em um grupo</CardTitle>
            <CardDescription>Para ver e gerenciar jogadores, você precisa fazer parte de um grupo.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isManager ? "Vá para as configurações para criar um grupo." : "Peça o link de convite ao gestor do seu grupo."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-center sm:text-left w-full">
            <CardTitle>
              Jogadores do grupo
              <br />
              <span className="text-primary">{user?.groupName || ""}</span>
            </CardTitle>
          </div>
          {isManager && (
            <Button onClick={handleShareLink} className="w-full sm:w-auto">
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar link
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-8">
              <FootballSpinner />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {players.map((player) => (
                <li key={player.uid} className="flex flex-col gap-3 py-4">
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <UserAvatar src={player.photoURL} size={48} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground break-words">{player.displayName}</p>
                        <p className="text-sm text-muted-foreground break-all">{player.email}</p>
                      </div>
                    </div>

                    {isManager && user?.uid !== player.uid && (
                      <div className='flex items-center justify-end gap-2'>
                          <Button variant="outline" size="icon">
                            <DollarSign className="h-4 w-4"/>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação removerá {player.displayName} do grupo. Ele precisará de um novo convite para entrar novamente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemovePlayer(player)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </div>
                    )}
                  </div>
                   {isManager && user?.uid !== player.uid && (
                      <div className="flex items-center space-x-2 pl-[64px]"> 
                        <Checkbox 
                            id={`debt-${player.uid}`}
                            checked={player.allowConfirmationWithDebt ?? false}
                            onCheckedChange={() => handleToggleDebtPermission(player)}
                            disabled={isPending}
                        />
                        <Label htmlFor={`debt-${player.uid}`} className="text-xs text-muted-foreground cursor-pointer">
                            Permitir confirmação de presença com pendência
                        </Label>
                      </div>
                    )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
