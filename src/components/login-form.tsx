"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { Apple } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { Icons } from "@/components/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z
    .string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = React.useState<"email" | "google" | "apple" | false>(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading("email");
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: "E-mail ou senha incorretos. Por favor, tente novamente.",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading("google");
    try {
      const authProvider = new GoogleAuthProvider();
      await signInWithPopup(auth, authProvider);
    } catch (error: any) {
      // Don't show an error if the user closes the popup
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      toast({
        variant: "destructive",
        title: "Falha no Login com Google",
        description: "Ocorreu um erro. Por favor, tente novamente.",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bem-vindo de Volta!</CardTitle>
        <CardDescription>
          Faça login na sua conta para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      disabled={!!isLoading}
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
                      disabled={!!isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={!!isLoading}>
              {isLoading === 'email' ? "Entrando..." : "Entrar com E-mail"}
            </Button>
          </form>
        </Form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Ou continue com
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={!!isLoading}
          >
            {isLoading === 'google' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-current" />
              ) : (
                <Icons.google className="mr-2 h-4 w-4" />
              )
            }
            Google
          </Button>
           <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Button
                      variant="outline"
                      disabled
                      className="w-full"
                    >
                      <Apple className="mr-2 h-4 w-4" />
                      Apple
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Login com Apple será implementado em breve.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
