
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const isManager = user?.userType === "Gestor do Grupo" || user?.userType === "Gestor da Quadra";

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
       <Card className="max-w-2xl mx-auto shadow-lg text-center">
          <CardHeader>
              <CardTitle>Página Movida</CardTitle>
              <CardDescription>
                  As configurações do grupo agora estão localizadas na sua página de perfil para facilitar o acesso.
              </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">
              {isManager 
                ? "Você pode gerenciar o nome do grupo, dias e horários dos jogos diretamente no seu perfil."
                : "Apenas gestores podem acessar as configurações."
              }
            </p>
            {isManager && (
              <Button asChild>
                <Link href="/profile">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Perfil
                </Link>
              </Button>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
