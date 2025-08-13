"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";

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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auth, firestore, storage } from "@/lib/firebase";
import { UserType } from "@/hooks/use-auth";
import { Camera } from "lucide-react";


const formSchema = z
  .object({
    displayName: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres."}),
    email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
    password: z
      .string()
      .min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    confirmPassword: z.string(),
    userType: z.nativeEnum(UserType, { required_error: "Por favor, selecione um tipo de usuário." }),
    photo: z.any().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não correspondem",
    path: ["confirmPassword"],
  });

export function SignupForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue('photo', file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      let photoURL = user.photoURL || null;

      if (values.photo) {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        await uploadBytes(storageRef, values.photo);
        photoURL = await getDownloadURL(storageRef);
      }

      // 1. Update Firebase Auth Profile
      await updateProfile(user, {
        displayName: values.displayName,
        photoURL: photoURL,
      });

      // 2. Create user document in Firestore
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: values.displayName,
        email: values.email,
        userType: values.userType,
        photoURL: photoURL,
        createdAt: new Date().toISOString(),
      });
      
      // Toast and redirect will be handled by AuthProvider
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Falha ao Cadastrar",
        description: error.code === 'auth/email-already-in-use' ? 'Este e-mail já está em uso.' : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Crie uma Conta</CardTitle>
        <CardDescription>
          Insira seus dados abaixo para começar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex justify-center mb-4">
                <div className="relative">
                  <Image
                    src={photoPreview || "https://placehold.co/100x100.png"}
                    alt="Foto do Perfil"
                    width={100}
                    height={100}
                    className="rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors"
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
              </div>
             <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome / Apelido</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu nome ou apelido"
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
              name="userType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Usuário</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o seu tipo de perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(UserType).map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="voce@exemplo.com"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
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
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando Conta..." : "Criar Conta"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
