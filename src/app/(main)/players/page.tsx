
"use client";

import { useEffect, useState } from 'react';
import { useAuth, User, UserType } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { UserAvatar } from '@/components/user-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Trash2, Copy, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function PlayersPage() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isManager = user?.userType === UserType.GESTOR_GRUPO;
  const groupId = user?.userType === UserType.GESTOR_GRUPO ? user.uid : user?.groupId;


  useEffect(() => {
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
      setPlayers(playersData);
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
  }, [groupId, toast]);

  const handleShareLink = () => {
    if (!user) return;
    const inviteLink = `${window.location.origin}/signup?group_id=${user?.uid}`;
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
        groupName: null,
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

  if (!user) {
     return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto shadow-lg text-center">
          <CardHeader>
            <CardTitle>Gerencie seu Grupo</CardTitle>
            <CardDescription>Faça login como Gestor de Grupo para adicionar e remover jogadores.</CardDescription>
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

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Jogadores do Grupo</CardTitle>
            <CardDescription>
              {user?.groupName ? `Membros do grupo "${user.groupName}"` : "Veja os membros do seu grupo."}
            </CardDescription>
          </div>
          {isManager && (
            <Button onClick={handleShareLink}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar link
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-4">
              {players.map((player) => (
                <li key={player.uid} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
                  <div className="flex items-center gap-4">
                    <UserAvatar src={player.photoURL} size={48} />
                    <div>
                      <p className="font-semibold text-foreground">{player.displayName}</p>
                      <p className="text-sm text-muted-foreground">{player.email}</p>
                    </div>
                  </div>
                  {isManager && user?.uid !== player.uid && (
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
