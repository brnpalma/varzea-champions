
"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, User, UserType, PlayerSubscriptionType } from "@/hooks/use-auth";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mail, Shield, User as UserIcon, Users, WalletCards, Edit, Save, Camera, X } from "lucide-react";
import { Button } from "../ui/button";
import { ProfileActions } from "./profile-actions";
import { useToast } from "@/hooks/use-toast";
import { auth, firestore } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

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

interface ProfileDetailsProps {
    user: User;
}

export function ProfileDetails({ user }: ProfileDetailsProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [playerSubscriptionType, setPlayerSubscriptionType] = useState<PlayerSubscriptionType>(PlayerSubscriptionType.AVULSO);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || "");
            setPlayerSubscriptionType(user.playerSubscriptionType || PlayerSubscriptionType.AVULSO);
            setPhotoPreview(user.photoURL || null);
        }
    }, [user]);

    const handleEditToggle = () => {
        const wasEditing = isEditing;
        setIsEditing(!isEditing);
        if (wasEditing && user) {
            setDisplayName(user.displayName || "");
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

    return (
        <CardContent className="space-y-6">
            {isEditing ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Editar Perfil</h3>
                        <Button onClick={handleEditToggle} variant="ghost" size="icon">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div>
                        <Label htmlFor="photo" className="block text-sm font-medium text-muted-foreground mb-1">Foto</Label>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                            <Camera className="mr-2 h-4 w-4" />
                            {photoFile ? "Trocar Foto" : "Escolher Foto"}
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                    <div>
                        <Label htmlFor="displayName" className="block text-sm font-medium text-muted-foreground mb-1">Nome / Apelido</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Seu nome ou apelido"
                        />
                    </div>
                    <div>
                        <Label htmlFor="playerSubscriptionType" className="block text-sm font-medium text-muted-foreground mb-1">Compromisso</Label>
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
            ) : (
                <div className="space-y-4 text-sm">
                    <div className="flex items-center">
                        <UserIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium text-foreground">{user.displayName}</span>
                    </div>
                    <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium text-foreground">{user.email}</span>
                    </div>
                    <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                            <span className="text-foreground">
                                Tipo de Conta: <span className="font-medium capitalize text-primary">{user.userType}</span>
                            </span>
                        </div>
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
                </div>
            )}

            <ProfileActions
                isEditing={isEditing}
                isSavingProfile={isSavingProfile}
                onEditToggle={handleEditToggle}
                onSaveProfile={handleSaveProfile}
                user={user}
            />
        </CardContent>
    );
}
