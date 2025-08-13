
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth, UserType } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Save } from "lucide-react"

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
  const { toast } = useToast();
  const timeInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    gameDays: {} as Record<string, boolean>,
    gameTime: "20:00",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isManager = user?.userType === UserType.GESTOR_GRUPO || user?.userType === UserType.GESTOR_QUADRA;

  useEffect(() => {
    if (!user || !isManager) {
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);
      const userDocRef = doc(firestore, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data().groupSettings) {
        const loadedSettings = docSnap.data().groupSettings;
        setSettings({
            gameDays: loadedSettings.gameDays || {},
            gameTime: loadedSettings.gameTime || "20:00",
        });
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, [user, isManager]);

  const handleDayChange = (dayId: string) => {
    setSettings(prev => ({ 
        ...prev, 
        gameDays: { ...prev.gameDays, [dayId]: !prev.gameDays[dayId] }
    }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, gameTime: e.target.value }));
  };
  
  const handleSave = async () => {
    if (!user || !isManager) return;
    setIsSaving(true);
    try {
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, { groupSettings: settings }, { merge: true });
      toast({
        title: "Salvo!",
        description: "Suas configurações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Error saving settings: ", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar suas configurações.",
      });
    } finally {
      setIsSaving(false);
    }
  };


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
             {isManager ? (
              <div>
                <h3 className="text-lg font-medium text-foreground">Grupo</h3>
                <Separator className="my-2" />
                {isLoading ? (
                   <div className="space-y-6 pt-4">
                     <Skeleton className="h-6 w-1/3" />
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                       {daysOfWeek.map(day => <Skeleton key={day.id} className="h-6 w-32" />)}
                     </div>
                     <Skeleton className="h-6 w-1/3 mt-4" />
                     <Skeleton className="h-10 w-32" />
                     <Skeleton className="h-10 w-40 mt-4" />
                   </div>
                ) : (
                  <div className="space-y-6 pt-4">
                    <div>
                      <Label className="text-base">Dias da pelada</Label>
                      <p className="text-sm text-muted-foreground mb-4">Selecione os dias da semana em que os jogos acontecem.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {daysOfWeek.map((day) => (
                          <div key={day.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={day.id}
                              checked={!!settings.gameDays[day.id]}
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
                        ref={timeInputRef}
                        id="game-time" 
                        type="time" 
                        value={settings.gameTime} 
                        onChange={handleTimeChange} 
                        className="max-w-xs"
                        onClick={() => timeInputRef.current?.showPicker()}
                      />
                    </div>
                     <div className="pt-2">
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Salvando..." : "Salvar Configurações do Grupo"}
                        </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

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
