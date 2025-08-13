
"use client";

import { useAuth, UserType } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut, updateProfile } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Mail, Shield, User, Edit, Save, Camera, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, setDoc } from "firebase/firestore";


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
        // Use JPEG for better compression for photos, with 80% quality
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


export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userType, setUserType] = useState<UserType>(UserType.JOGADOR);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setUserType(user.userType || UserType.JOGADOR);
      setPhotoPreview(user.photoURL || null);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sessão Encerrada",
        description: "Você foi desconectado com sucesso.",
      });
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
      // Reset fields to current user data when canceling edit
      setDisplayName(user.displayName || "");
      setUserType(user.userType || UserType.JOGADOR);
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
  
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    let photoURL = user.photoURL;

    try {
      // If a new photo was selected, process and update it
      if (photoFile) {
        photoURL = await resizeAndEncodeImage(photoFile);
      }

      const userProfile = {
        displayName,
        userType,
        photoURL,
      };

      // 1. Update Firestore first, as it's our primary source of truth
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, { 
        displayName: userProfile.displayName, 
        userType: userProfile.userType,
        photoURL: userProfile.photoURL 
      }, { merge: true });

      // 2. Then update Firebase Auth profile if any relevant data changed
      if (auth.currentUser && (auth.currentUser.displayName !== userProfile.displayName || auth.currentUser.photoURL !== userProfile.photoURL)) {
          await updateProfile(auth.currentUser, { 
            displayName: userProfile.displayName, 
            photoURL: userProfile.photoURL 
          });
      }
      
      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      setIsEditing(false);

    } catch (error: any) {
      console.error("Failed to save profile:", error);
      
      let description = "Ocorreu um erro ao salvar o perfil. Por favor, tente novamente.";
      if (error.code === 'auth/invalid-profile-attribute') {
        description = "Ocorreu um erro ao atualizar a foto. Tente uma imagem menor.";
      }

      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: description,
      });
    } finally {
      setIsSaving(false);
    }
  };


  if (loading || !user) {
    // You can show a loading skeleton here
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image
                  src={photoPreview || "https://placehold.co/80x80.png"}
                  alt="Foto do Perfil"
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
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
            <Button onClick={handleEditToggle} variant="ghost" size="icon">
              {isEditing ? <X className="h-5 w-5"/> : <Edit className="h-5 w-5" />}
            </Button>
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
                    <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground">
                        Tipo de Conta: <span className="font-medium capitalize text-primary">{user.userType}</span>
                    </span>
                </div>
            </div>
          )}
           
          <div className="flex justify-between items-center">
             {isEditing ? (
                 <Button onClick={handleSave} disabled={isSaving}>
                   {isSaving ? "Salvando..." : <><Save className="mr-2 h-4 w-4" /> Salvar Alterações</>}
                 </Button>
             ) : (
                <Button onClick={handleLogout} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </Button>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
