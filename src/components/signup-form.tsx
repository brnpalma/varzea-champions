
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useSearchParams, useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, writeBatch } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auth, firestore } from "@/lib/firebase";
import { UserType, PlayerSubscriptionType, useAuth } from "@/hooks/use-auth";
import { Camera, Star } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { Label } from "./ui/label";


const formSchema = z
  .object({
    displayName: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres."}),
    email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    userType: z.nativeEnum(UserType, { required_error: "Por favor, selecione um tipo de usuário." }),
    playerSubscriptionType: z.nativeEnum(PlayerSubscriptionType, { required_error: "Por favor, selecione uma opção." }),
    rating: z.number().min(1).max(5),
    photo: z.instanceof(File).optional(),
  })
  .refine((data) => {
    // Password confirmation is only required if a password is provided
    if (data.password) {
      return data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: "As senhas não correspondem",
    path: ["confirmPassword"],
  })
  .refine(data => {
      // Password is required only if the user is not already authenticated (e.g., via Google)
      const currentUser = auth.currentUser;
      return !!currentUser || (!!data.password && data.password.length >= 6);
  }, {
      message: "A senha deve ter pelo menos 6 caracteres.",
      path: ["password"],
  });


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

function SignupFormComponent() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupIdFromUrl = searchParams.get('group_id');
  const { user: authUser } = useAuth(); // Get the authenticated user
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: authUser?.displayName || "",
      email: authUser?.email || "",
      password: "",
      confirmPassword: "",
      userType: groupIdFromUrl ? UserType.JOGADOR : undefined,
      playerSubscriptionType: undefined,
      rating: 3,
      photo: undefined,
    },
  });
  
  React.useEffect(() => {
    if (authUser) {
      form.setValue('displayName', authUser.displayName || "");
      form.setValue('email', authUser.email || "");
      form.setValue('rating', authUser.rating || 3);
      setPhotoPreview(authUser.photoURL || null);
    } else {
      // If user logs out (e.g., deletes profile), clear the form
      form.reset({
        displayName: "",
        email: "",
        password: "",
        confirmPassword: "",
        userType: groupIdFromUrl ? UserType.JOGADOR : undefined,
        playerSubscriptionType: undefined,
        rating: 3,
        photo: undefined,
      });
      setPhotoPreview(null);
    }
  }, [authUser, form, groupIdFromUrl]);

  const availableUserTypes = React.useMemo(() => {
    const allTypes = Object.values(UserType);
    if (groupIdFromUrl) {
        return allTypes.filter(type => type === UserType.JOGADOR);
    }
    // If not a group invite, and not completing a Google Sign-In, hide "Jogador"
    if (!authUser) {
       return allTypes.filter(type => type !== UserType.JOGADOR);
    }
    return allTypes;
  }, [groupIdFromUrl, authUser]);


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue('photo', file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    if (values.userType === UserType.JOGADOR && !groupIdFromUrl) {
       toast({
        variant: "destructive",
        title: "Falha no Cadastro",
        description: "Jogadores só podem se cadastrar através de um link de convite válido.",
      });
      setIsLoading(false);
      return;
    }

    try {
      let user = auth.currentUser;

      // If there's no authenticated user, it means this is a fresh email/password signup.
      if (!user) {
        if (!values.password) {
          toast({ variant: "destructive", title: "Senha obrigatória" });
          setIsLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        user = userCredential.user;
      }
      
      if (!user) {
          throw new Error("Falha na autenticação do usuário.");
      }

      // At this point, `user` is guaranteed to be a FirebaseAuth user object.
      
      let photoURL = user.photoURL; // Keep existing photo by default
      if (values.photo) {
        try {
          photoURL = await resizeAndEncodeImage(values.photo);
        } catch (photoError) {
            console.error("Error processing photo:", photoError);
            toast({
              variant: "destructive",
              title: "Erro na Imagem",
              description: "Não foi possível processar sua foto, mas seu perfil será salvo sem ela.",
            });
        }
      }

      await updateProfile(user, {
        displayName: values.displayName,
      });

      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, "users", user.uid);

      let finalGroupId: string | null = null;
      
      if (values.userType === UserType.GESTOR_GRUPO) {
        const groupName = `Grupo de ${values.displayName}`;
        finalGroupId = user.uid; // O ID do grupo é o UID do gestor
        const groupDocRef = doc(firestore, "groups", finalGroupId);

        batch.set(groupDocRef, {
            name: groupName,
            managerId: user.uid,
            createdAt: new Date().toISOString(),
            gameDays: {}
        });
      } else if (values.userType === UserType.JOGADOR && groupIdFromUrl) {
        const groupDocRef = doc(firestore, "groups", groupIdFromUrl);
        const groupDocSnap = await getDoc(groupDocRef);

        if (!groupDocSnap.exists()) {
          throw new Error("O grupo do convite não foi encontrado.");
        }
        finalGroupId = groupIdFromUrl;
      }

      batch.set(userDocRef, {
        uid: user.uid,
        email: values.email,
        displayName: values.displayName,
        photoURL: photoURL,
        userType: values.userType,
        playerSubscriptionType: values.playerSubscriptionType,
        rating: values.rating,
        groupId: finalGroupId,
        createdAt: new Date().toISOString(),
        allowConfirmationWithDebt: true, // Habilitado por padrão
      });
      
      await batch.commit();

      toast({
          variant: "success",
          title: "Cadastro Concluído!",
          description: "Seu perfil foi criado com sucesso.",
      });

      router.push('/');
      
    } catch (error: any) {
      console.error("Signup Error:", error);
      let description = "Ocorreu um erro desconhecido. Tente novamente.";
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este e-mail já está em uso.';
      } else if (error.message) {
          description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Falha ao Cadastrar",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="pt-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex items-end gap-4">
               <div className="relative shrink-0">
                  <UserAvatar src={photoPreview} size={80} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isLoading}
                  />
               </div>
               <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Nome / Apelido</FormLabel>
                    <FormControl>
                      <Input
                        placeholder=""
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
               />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipo de Usuário</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value} 
                      disabled={isLoading || (!!groupIdFromUrl && !!authUser)}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {availableUserTypes.map((type) => (
                          <SelectItem key={type} value={type} disabled={groupIdFromUrl && type !== UserType.JOGADOR}>
                            {type}
                          </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="playerSubscriptionType"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Compromisso</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {Object.values(PlayerSubscriptionType).map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder=""
                    {...field}
                    disabled={isLoading || !!authUser} // Disable if completing profile
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
              <FormItem>
                  <Label>Classificação (Estrelas)</Label>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()} disabled={isLoading}>
                  <FormControl>
                      <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                      {[5, 4, 3, 2, 1].map(r => (
                        <SelectItem key={r} value={r.toString()}>
                          <div className="flex items-center gap-2">
                            {r} <Star className="h-4 w-4 text-amber-500 fill-current" />
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
                  <FormMessage />
              </FormItem>
              )}
          />
          {!authUser && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder=""
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder=""
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
            {isLoading ? "Salvando..." : (authUser ? "Concluir Cadastro" : "Criar Conta")}
          </Button>
        </form>
      </Form>
    </div>
  );
}

// React.Suspense is required for useSearchParams to work.
export function SignupForm() {
  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <SignupFormComponent />
    </React.Suspense>
  )
}

    