
"use client"

import { useState } from "react"
import { useAuth, UserType } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const daysOfWeek = [
  { id: "segunda", label: "Segunda-feira" },
  { id: "terca", label: "Terça-feira" },
  { id: "quarta", label: "Quarta-feira" },
  { id: "quinta", label: "Quinta-feira" },
  { id: "sexta", label: "Sexta-feira" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  const [gameTime, setGameTime] = useState("20:00");

  const handleDayChange = (dayId: string) => {
    setSelectedDays(prev => ({ ...prev, [dayId]: !prev[dayId] }));
  };
  
  const isManager = user?.userType === UserType.GESTOR_GRUPO || user?.userType === UserType.GESTOR_QUADRA;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Configurações</CardTitle>
          <CardDescription>
            Gerencie as configurações da sua conta e preferências do aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            {/* Seção de Configurações do Grupo (Visível apenas para gestores) */}
            {isManager && (
              <div>
                <h3 className="text-lg font-medium text-foreground">Grupo</h3>
                <Separator className="my-2" />
                <div className="space-y-6 pt-4">
                  <div>
                    <Label className="text-base">Dias da pelada</Label>
                    <p className="text-sm text-muted-foreground mb-4">Selecione os dias da semana em que os jogos acontecem.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {daysOfWeek.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.id}
                            checked={!!selectedDays[day.id]}
                            onCheckedChange={() => handleDayChange(day.id)}
                          />
                          <Label htmlFor={day.id} className="font-normal cursor-pointer">{day.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="game-time" className="text-base">Horário dos jogos</Label>
                     <p className="text-sm text-muted-foreground mb-2">Informe o horário de início padrão para os dias selecionados.</p>
                    <Input 
                      id="game-time" 
                      type="time" 
                      value={gameTime} 
                      onChange={(e) => setGameTime(e.target.value)} 
                      className="max-w-xs"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                      <Button>Salvar Configurações do Grupo</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Seção de Configurações do App (Visível para todos) */}
            <div>
              <h3 className="text-lg font-medium text-foreground">Aplicativo</h3>
              <Separator className="my-2" />
              <div className="flex items-center justify-center text-center p-8">
                  <p className="text-muted-foreground">Mais configurações do aplicativo em breve.</p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
