
"use client";

import { useAuth, UserType, PlayerSubscriptionType } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut, updateProfile, deleteUser } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Mail, Shield, User, Edit, Save, Camera, X, Users, WalletCards, LogIn, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, writeBatch, setDoc, onSnapshot } from "firebase/firestore";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
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
import { FootballSpinner } from "@/components/ui/football-spinner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";


const resizeAndEncodeImage = (file: File, maxSize = 256): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const daysOfWeek = [
  { id: "segunda", label: "Segunda-feira" },
  { id: "terca", label: "Terça-feira" },
  { id: "quarta", label: "Quarta-feira" },
  { id: "quinta", label: "Quinta-feira" },
  { id: "sexta", label: "Sexta-feira" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

interface GameDaySetting {
  selected: boolean;
  time: string;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Profile Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userType, setUserType] = useState<UserType>(UserType.JOGADOR);
  const [playerSubscriptionType, setPlayerSubscriptionType] = useState<PlayerSubscriptionType>(PlayerSubscriptionType.AVULSO);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group Settings State
  const [settings, setSettings] = useState<{
    gameDays: Record<string, GameDaySetting>;
  }>({
    gameDays: Object.fromEntries(daysOfWeek.map(day => [day.id, { selected: false, time: '' }]))
  });
  const [groupName, setGroupName] = useState("");
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const isManager = user?.userType === UserType.GESTOR_GRUPO || user?.userType === UserType.GESTOR_QUADRA;
  const isGroupManager = user?.userType === UserType.GESTOR_GRUPO;
  const groupId = user?.groupId;

  // Effect for Profile Data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setUserType(user.userType || UserType.JOGADOR);
      setPlayerSubscriptionType(user.playerSubscriptionType || PlayerSubscriptionType.AVULSO);
      setPhotoPreview(user.photoURL || null);
    }
  }, [user]);
  
  // Effect for Group Settings Data
  useEffect(() => {
    if (!isManager || !groupId) {
      setIsSettingsLoading(false);
      return;
    }

    setIsSettingsLoading(true);
    const groupDocRef = doc(firestore, "groups", groupId);
    
    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const groupData = docSnap.data();
        if (groupData.gameDays) {
          const loadedSettings = groupData.gameDays;
          const mergedGameDays: Record<string, GameDaySetting> = {};
          daysOfWeek.forEach(day => {
              mergedGameDays[day.id] = loadedSettings[day.id] || { selected: false, time: '' };
          });
          setSettings({ gameDays: mergedGameDays });
        }
        if (groupData.name) {
            setGroupName(groupData.name);
        }
      }
       setIsSettingsLoading(false);
    }, (error) => {
        console.error("Error fetching settings:", error);
        setIsSettingsLoading(false);
    });

    return () => unsubscribe();
  }, [isManager, groupId]);


  const handleLogout = async () => {
    try {
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

  const handleEditToggle = () => {
    const wasEditing = isEditing;
    setIsEditing(!isEditing);
     if (wasEditing && user) {
      setDisplayName(user.displayName || "");
      setUserType(user.userType || UserType.JOGADOR);
      setPlayerSubscriptionType(user.playerSubscriptionType || PlayerSubscriptionType.AVULSO);
      setPhotoFile(null);
      setPhotoPreview(user.photoURL || null);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);
    let newPhotoURL = user.photoURL;

    try {
        if (photoFile) {
            newPhotoURL = await resizeAndEncodeImage(photoFile);
        }
        
        const userDocRef = doc(firestore, "users", user.uid);
        
        const batch = writeBatch(firestore);
        batch.set(userDocRef, {
            displayName: displayName,
            userType: userType,
            playerSubscriptionType: playerSubscriptionType,
            photoURL: newPhotoURL,
        }, { merge: true });

        await batch.commit();

        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: displayName,
            });
        }

        toast({
            variant: "success",
            title: "Perfil Atualizado",
            description: "Suas informações foram salvas com sucesso.",
        });
        setIsEditing(false);
        setPhotoFile(null);

    } catch (error: any) {
        console.error("Failed to save profile:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: "Ocorreu um erro ao salvar o perfil. Por favor, tente novamente.",
        });
    } finally {
        setIsSavingProfile(false);
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
      // Step 1: Delete Firestore data FIRST, because auth is needed for rules.
      const batch = writeBatch(firestore);
      
      const userDocRef = doc(firestore, "users", user.uid);
      batch.delete(userDocRef);

      if (user.userType === UserType.GESTOR_GRUPO && user.groupId) {
        const groupDocRef = doc(firestore, "groups", user.groupId);
        batch.delete(groupDocRef);
      }
      
      await batch.commit();
      
      // Step 2: If Firestore deletion succeeds, delete the user from Firebase Auth.
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
  }
  
  // Group Settings Handlers
  const handleDayChange = (dayId: string) => {
    setSettings(prev => ({ 
      ...prev,
      gameDays: {
        ...prev.gameDays,
        [dayId]: {
          ...prev.gameDays[dayId],
          selected: !prev.gameDays[dayId].selected,
        }
      }
    }));
  };

  const handleTimeChange = (dayId: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      gameDays: {
        ...prev.gameDays,
        [dayId]: {
          ...prev.gameDays[dayId],
          time: value
        }
      }
    }));
  };
  
  const handleSaveSettings = async () => {
    if (!user || !isManager || !groupId) return;

    if (isGroupManager && !groupName.trim()) {
        toast({
            variant: "destructive",
            title: "Campo Obrigatório",
            description: "O nome do grupo não pode estar vazio.",
        });
        return;
    }

    for (const day of daysOfWeek) {
        const setting = settings.gameDays[day.id];
        if (setting.selected && !setting.time) {
            toast({
                variant: "destructive",
                title: "Campo Obrigatório",
                description: `Por favor, defina um horário para ${day.label}.`,
            });
            return;
        }
    }

    setIsSavingSettings(true);
    try {
      const groupDocRef = doc(firestore, "groups", groupId);
      
      const dataToUpdate: any = {
          gameDays: settings.gameDays
      };

      if (isGroupManager) {
          dataToUpdate.name = groupName.trim();
      }

      await setDoc(groupDocRef, dataToUpdate, { merge: true });

      toast({
        variant: "success",
        title: "Salvo!",
        description: "Suas configurações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Error saving settings: ", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar suas configurações.",
      });
    } finally {
      setIsSavingSettings(false);
    }
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
            <CardTitle>Acesse seu Perfil</CardTitle>
            <CardDescription>Faça login para ver e gerenciar os detalhes do seu perfil.</CardDescription>
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
      <div className="max-w-2xl mx-auto space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <UserAvatar src={photoPreview} size={80} />
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1 rounded-full hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
                <div>
                  <CardTitle className="text-2xl">{isEditing ? "Editar Perfil" : user.displayName || "Perfil do Usuário"}</CardTitle>
                  <CardDescription>Veja e gerencie os detalhes do seu perfil.</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleEditToggle} variant="ghost" size="icon">
                  {isEditing ? <X className="h-5 w-5"/> : <Edit className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-muted-foreground mb-1">Nome / Apelido</label>
                    <Input 
                      id="displayName" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      placeholder="Seu nome ou apelido"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="userType" className="block text-sm font-medium text-muted-foreground mb-1">Tipo de Usuário</label>
                        <Select value={userType} onValueChange={(value) => setUserType(value as UserType)}>
                          <SelectTrigger id="userType">
                            <SelectValue placeholder="Selecione o tipo de usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(UserType).map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                      <div>
                      <label htmlFor="playerSubscriptionType" className="block text-sm font-medium text-muted-foreground mb-1">Compromisso</label>
                        <Select value={playerSubscriptionType} onValueChange={(value) => setPlayerSubscriptionType(value as PlayerSubscriptionType)}>
                          <SelectTrigger id="playerSubscriptionType">
                            <SelectValue placeholder="Selecione seu plano" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(PlayerSubscriptionType).map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                  <div className="flex items-center">
                      <User className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium text-foreground">{user.displayName}</span>
                  </div>
                  <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium text-foreground">{user.email}</span>
                  </div>
                  <div className="flex items-center">
                      <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="text-foreground">
                          Nome do Grupo: <span className="font-medium capitalize text-primary">{user.groupName || "Nenhum grupo"}</span>
                      </span>
                  </div>
                  <div className="flex items-center">
                      <WalletCards className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="text-foreground">
                          Compromisso: <span className="font-medium capitalize text-primary">{user.playerSubscriptionType}</span>
                      </span>
                  </div>
                  <div className="flex items-center">
                      <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="text-foreground">
                          Tipo de Conta: <span className="font-medium capitalize text-primary">{user.userType}</span>
                      </span>
                  </div>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t">
              {isEditing ? (
                  <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? "Salvando..." : <><Save className="mr-2 h-4 w-4" /> Salvar Alterações</>}
                  </Button>
              ) : (
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">
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
                            <Button variant="destructive" disabled={isDeleting}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isDeleting ? "Deletando..." : "Deletar Perfil"}
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
              )}
            </div>
          </CardContent>
        </Card>

        {isManager && (
          <div>
            <Label className="text-base font-semibold text-muted-foreground">Configurações</Label>
            <Card className="shadow-lg mt-2">
              <CardHeader>
                <CardTitle>Grupo</CardTitle>
                <CardDescription>
                  Gerencie as configurações dos jogos e do seu grupo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSettingsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <FootballSpinner />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {isGroupManager && (
                      <div className="space-y-2">
                        <Label htmlFor="group-name" className="text-base">Nome do Grupo</Label>
                         <Input
                            id="group-name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Digite o nome do grupo"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-base">Dias e Horários</Label>
                      <p className="text-sm text-muted-foreground mb-4">Selecione os dias e horários dos jogos.</p>
                      <div className="space-y-4">
                        {daysOfWeek.map((day) => (
                          <div key={day.id} className="flex items-center space-x-4 justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={day.id}
                                    checked={!!settings.gameDays[day.id]?.selected}
                                    onCheckedChange={() => handleDayChange(day.id)}
                                />
                                <Label htmlFor={day.id} className="font-normal cursor-pointer min-w-[100px]">{day.label}</Label>
                            </div>
                            <div>
                                <Input
                                    id={`time-${day.id}`}
                                    type="time"
                                    step="1800" // 30 minutos em segundos
                                    value={settings.gameDays[day.id]?.time || ''}
                                    onChange={(e) => handleTimeChange(day.id, e.target.value)}
                                    className="w-40"
                                    disabled={!settings.gameDays[day.id]?.selected}
                                />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                     <div className="pt-4 flex justify-end">
                        <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSavingSettings ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
