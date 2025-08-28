
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, firestore } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { User, PlayerSubscriptionType } from "@/hooks/use-auth";
import { UserAvatar } from "../user-avatar";

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

interface EditProfileDialogProps {
    user: User;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export function EditProfileDialog({ user, isOpen, setIsOpen }: EditProfileDialogProps) {
    const { toast } = useToast();
    const [displayName, setDisplayName] = useState("");
    const [playerSubscriptionType, setPlayerSubscriptionType] = useState<PlayerSubscriptionType>(PlayerSubscriptionType.AVULSO);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && user) {
            setDisplayName(user.displayName || "");
            setPlayerSubscriptionType(user.playerSubscriptionType || PlayerSubscriptionType.AVULSO);
            setPhotoPreview(user.photoURL || null);
            setPhotoFile(null);
        }
    }, [isOpen, user]);

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
            setIsOpen(false);
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                        Faça alterações em seu perfil aqui. Clique em salvar quando terminar.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <UserAvatar src={photoPreview} size={96} />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full max-w-sm">
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
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSavingProfile ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
