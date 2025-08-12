"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Moon, Sun } from "lucide-react"

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Configurações</CardTitle>
          <CardDescription>
            Gerencie as configurações da sua conta e preferências do aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <h3 className="text-lg font-medium text-foreground">Aparência</h3>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                        {theme === "dark" ? "Modo Escuro" : "Modo Claro"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Atualmente o tema está no modo {theme === "dark" ? "escuro" : "claro"}.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Alternar tema</span>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
