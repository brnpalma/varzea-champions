"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Shield, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

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

  if (!user) {
    return null;
  }

  const providerId = user.providerData?.[0]?.providerId || "N/A";
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-4">
             <User className="h-16 w-16 rounded-full bg-secondary p-4 text-secondary-foreground"/>
            <div>
                <CardTitle className="text-2xl">{user.displayName || "Perfil do Usuário"}</CardTitle>
                <CardDescription>Veja e gerencie os detalhes do seu perfil.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 text-sm">
                <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <div className="flex items-center">
                    <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground">
                        Autenticado via <span className="font-medium capitalize text-primary">{providerId.replace('.com', '')}</span>
                    </span>
                </div>
            </div>
            <Button onClick={handleLogout} className="w-full sm:w-auto" variant="destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
