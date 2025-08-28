
"use client";

import { useEffect, useState } from 'react';
import { useAuth, User, UserType } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { UserAvatar } from '@/components/user-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, LogIn, MoreVertical, DollarSign, Star } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { FootballSpinner } from '@/components/ui/football-spinner';
import { PaymentHistoryDialog } from '@/components/payment-history-dialog';
import { EditRatingDialog } from '@/components/edit-rating-dialog';
import { InviteButton } from '@/components/invite-button';

export default function PlayersPage() {
  const { user, loading } = useAuth();
  const [players, setPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [playerToEditRating, setPlayerToEditRating] = useState<User | null>(null);
  
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
      
      const sortedPlayers = playersData.sort((a, b) => {
        // Prioritize the logged-in user
        if (user && a.uid === user.uid) return -1;
        if (user && b.uid === user.uid) return 1;
        // Then sort by display name
        return a.displayName!.localeCompare(b.displayName!);
      });
      setPlayers(sortedPlayers);
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
  }, [groupId, toast, loading, user]);

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
  
  const openPaymentHistory = (player: User) => {
    setSelectedPlayer(player);
    setIsPaymentHistoryOpen(true);
  };

  const handleEditRating = (player: User) => {
    setPlayerToEditRating(player);
  };

  const handleSaveRating = async (newRating: number) => {
    if (!isManager || !playerToEditRating) return;

    try {
      const playerDocRef = doc(firestore, "users", playerToEditRating.uid);
      await updateDoc(playerDocRef, {
        rating: newRating,
      });

      toast({
        variant: 'success',
        title: 'Classificação Atualizada',
        description: `A classificação de ${playerToEditRating.displayName} foi atualizada para ${newRating} estrelas.`,
      });
      setPlayerToEditRating(null); // Close dialog
    } catch (error) {
      console.error("Error updating rating: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Atualizar',
        description: 'Não foi possível atualizar a classificação.',
      });
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center h-full">
        <FootballSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="w-full text-center">
            <CardTitle className="text-2xl">
              Jogadores do grupo
              <span className="block text-primary font-bold mt-1">{user?.groupName || ""}</span>
            </CardTitle>
          </div>
          {isManager && (
            <InviteButton user={user} className="w-full sm:w-auto" />
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-8 h-full">
              <FootballSpinner />
            </div>
          ) : (
            <>
              <div className="text-right mb-2 pr-2">
                <p className="text-sm font-semibold text-muted-foreground">Total: {players.length}</p>
              </div>
              <ul className="divide-y divide-border">
                {players.map((player) => {
                  const playerRating = player.rating || 1;
                  const isCurrentUser = user?.uid === player.uid;

                  return (
                    <li key={player.uid} className="py-4">
                      <div className="flex items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <UserAvatar src={player.photoURL} size={48} />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground break-words">{player.displayName}</p>
                            <div className="flex items-center text-amber-500">
                              {[...Array(playerRating)].map((_, i) => <Star key={`filled-${i}`} className="h-4 w-4 fill-current" />)}
                              {[...Array(5 - playerRating)].map((_, i) => <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground/30" />)}
                            </div>
                          </div>
                        </div>
                        
                        {isManager && (
                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleEditRating(player)}>
                                  <Star className="mr-2 h-4 w-4" />
                                  <span>Editar Estrelas</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => openPaymentHistory(player)}>
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  <span>Histórico Financeiro</span>
                                </DropdownMenuItem>
                                {!isCurrentUser && (
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span>Remover do Grupo</span>
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {!isCurrentUser && (
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
                            )}
                          </AlertDialog>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
      {selectedPlayer && (
        <PaymentHistoryDialog
          player={selectedPlayer}
          groupId={groupId!}
          isOpen={isPaymentHistoryOpen}
          setIsOpen={setIsPaymentHistoryOpen}
        />
      )}
      {playerToEditRating && (
        <EditRatingDialog
          player={playerToEditRating}
          isOpen={!!playerToEditRating}
          onOpenChange={(isOpen) => !isOpen && setPlayerToEditRating(null)}
          onSave={handleSaveRating}
        />
      )}
        {!user && (
            <div className="mt-8">
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
        )}
       {!groupId && user && (
         <div className="mt-8">
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
      )}
    </div>
  );
}
