
"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth, UserType } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

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

  const [settings, setSettings] = useState({
    gameDays: {} as Record<string, boolean>,
    gameTime: "20:00",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isManager = user?.userType === UserType.GESTOR_GRUPO || user?.userType === UserType.GESTOR_QUADRA;

  const saveSettings = useCallback(async (newSettings: typeof settings) => {
    if (!user || !isManager) return;
    setIsSaving(true);
    try {
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, { groupSettings: newSettings }, { merge: true });
      toast({
        title: "Salvo!",
        description: "Suas configurações foram salvas automaticamente.",
        duration: 2000,
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
  }, [user, isManager, toast]);
  
  // Fetch settings on component mount
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

  // Autosave on settings change
  useEffect(() => {
    if (isLoading) return; // Don't save on initial load
    const handler = setTimeout(() => {
      saveSettings(settings);
    }, 1000); // Debounce saves by 1 second

    return () => {
      clearTimeout(handler);
    };
  }, [settings, isLoading, saveSettings]);

  const handleDayChange = (dayId: string) => {
    setSettings(prev => ({ 
        ...prev, 
        gameDays: { ...prev.gameDays, [dayId]: !prev.gameDays[dayId] }
    }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, gameTime: e.target.value }));
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
            {isManager && (
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
                        id="game-time" 
                        type="time" 
                        value={settings.gameTime} 
                        onChange={handleTimeChange} 
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

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
