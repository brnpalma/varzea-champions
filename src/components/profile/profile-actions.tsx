
"use client";

import { useState } from "react";
import { useAuth, User, UserType } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Edit, Save, Trash2 } from "lucide-react";
import { signOut, deleteUser } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
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
import { doc, writeBatch } from "firebase/firestore";

interface ProfileActionsProps {
    isEditing: boolean;
    isSavingProfile: boolean;
    onEditToggle: () => void;
    onSaveProfile: () => Promise<void>;
    user: User;
}

export function ProfileActions({ isEditing, isSavingProfile, onEditToggle, onSaveProfile, user }: ProfileActionsProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleLogout = async () => {
        try {
            sessionStorage.removeItem('invite_group_id');
            await signOut(auth);
            toast({
                variant: "success",
                title: "Sessão Encerrada",
                description: "Você foi desconectado com sucesso.",
            });
            router.push('/');
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Falha ao Sair",
                description: error.message,
            });
        }
    };

    const handleDeleteProfile = async () => {
        const currentUser = auth.currentUser;
        if (!user || !currentUser) {
          toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado." });
          return;
        }
      
        setIsDeleting(true);
        
        try {
          const isManagerType = user.userType === UserType.GESTOR_GRUPO || user.userType === UserType.GESTOR_QUADRA;
    
          const batch = writeBatch(firestore);
          const userDocRef = doc(firestore, "users", user.uid);
      
          if (isManagerType) {
            batch.update(userDocRef, { deletado: true });
            if (user.groupId) {
              const groupDocRef = doc(firestore, "groups", user.groupId);
              batch.update(groupDocRef, { deletado: true });
            }
          } else {
            batch.delete(userDocRef);
          }
          
          await batch.commit();
      
          await deleteUser(currentUser);
          
          toast({
            variant: "success",
            title: "Perfil Deletado",
            description: "Sua conta e todos os dados associados foram removidos.",
          });
      
          router.push('/');
      
        } catch (error: any) {
          console.error("Failed to delete profile:", error);
          let description = "Ocorreu um erro ao deletar seu perfil.";
      
          if (error.code === 'auth/requires-recent-login') {
            description = "Esta operação é sensível e requer login recente. Por favor, saia e entre novamente antes de tentar deletar seu perfil.";
          }
      
          toast({
            variant: "destructive",
            title: "Falha ao Deletar",
            description: description,
          });
        } finally {
          setIsDeleting(false);
        }
      };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-4">
            {isEditing ? (
                <Button onClick={onSaveProfile} disabled={isSavingProfile} className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    {isSavingProfile ? "Salvando..." : "Salvar Alterações"}
                </Button>
            ) : (
                <>
                    <Button variant="outline" onClick={onEditToggle} className="w-full sm:w-auto">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Perfil
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="flex-1">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sair
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza que deseja sair?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Você precisará fazer login novamente para acessar seu perfil e gerenciar seu time.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleLogout}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        Sair
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeleting} className="flex-1">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {isDeleting ? "Deletando..." : "Deletar"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Deletar Perfil Permanentemente?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação é irreversível e deletará sua conta e todos os dados associados.
                                        {user.userType === UserType.GESTOR_GRUPO && " Como você é um gestor, seu grupo também será deletado."}
                                        <br /><br />
                                        Tem certeza que deseja continuar?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteProfile}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? "Deletando..." : "Sim, Deletar Tudo"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </>
            )}
        </div>
    );
}
