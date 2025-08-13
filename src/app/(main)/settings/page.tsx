
"use client"

import { useState, useEffect } from "react"
import { useAuth, UserType } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { LogIn, Save } from "lucide-react"
import Link from "next/link"

const daysOfWeek = [
  { id: "segunda", label: "Segunda-feira" },
  { id: "terca", label: "Terça-feira" },
  { id: "quarta", label: "Quarta-feira" },
  { id: "quinta", label: "Quinta-feira" },
  { id: "sexta", label: "Sexta-feira" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

interface GameDaySetting {
  selected: boolean;
  time: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<{
    gameDays: Record<string, GameDaySetting>;
  }>({
    gameDays: Object.fromEntries(daysOfWeek.map(day => [day.id, { selected: false, time: '' }]))
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
        // Merge loaded settings with default to ensure all days are present
        const initialGameDays: Record<string, GameDaySetting> = {};
        daysOfWeek.forEach(day => {
            initialGameDays[day.id] = loadedSettings.gameDays?.[day.id] || { selected: false, time: '' };
        });

        setSettings(prev => ({
            ...prev,
            gameDays: initialGameDays,
        }));

      }
      setIsLoading(false);
    };

    fetchSettings();
  }, [user, isManager]);

  const handleDayChange = (dayId: string) => {
    setSettings(prev => ({ 
      ...prev,
      gameDays: {
        ...prev.gameDays,
        [dayId]: {
          ...prev.gameDays[dayId],
          selected: !prev.gameDays[dayId].selected,
        }
      }
    }));
  };

  const handleTimeChange = (dayId: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      gameDays: {
        ...prev.gameDays,
        [dayId]: {
          ...prev.gameDays[dayId],
          time: value
        }
      }
    }));
  };
  
  const handleSave = async () => {
    if (!user || !isManager) return;

    // Validation
    for (const day of daysOfWeek) {
        const setting = settings.gameDays[day.id];
        if (setting.selected && !setting.time) {
            toast({
                variant: "destructive",
                title: "Campo Obrigatório",
                description: `Por favor, defina um horário para ${day.label}.`,
            });
            return;
        }
    }

    setIsSaving(true);
    try {
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, { groupSettings: settings }, { merge: true });
      toast({
        variant: "success",
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


  if (!user) {
     return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto shadow-lg text-center">
          <CardHeader>
            <CardTitle>Ajustes do Grupo e App</CardTitle>
            <CardDescription>Faça login como Gestor para configurar os dias de jogos e outras opções.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild size="lg">
                <Link href="/login">
                  <LogIn className="mr-2" />
                  Fazer Login ou Criar Conta
                </Link>
              </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {isManager ? (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Grupo</CardTitle>
                <CardDescription>
                    Gerencie as configurações dos jogos do seu grupo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                   <div className="space-y-6 pt-4">
                     <Skeleton className="h-6 w-1/3" />
                     <div className="space-y-4">
                       {daysOfWeek.map(day => <Skeleton key={day.id} className="h-10 w-full" />)}
                     </div>
                     <div className="flex justify-end pt-2">
                        <Skeleton className="h-10 w-40" />
                     </div>
                   </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base">Dias e Horários</Label>
                      <p className="text-sm text-muted-foreground mb-4">Selecione os dias e horários dos jogos.</p>
                      <div className="space-y-4">
                        {daysOfWeek.map((day) => (
                          <div key={day.id} className="flex items-center space-x-4 justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={day.id}
                                    checked={!!settings.gameDays[day.id]?.selected}
                                    onCheckedChange={() => handleDayChange(day.id)}
                                />
                                <Label htmlFor={day.id} className="font-normal cursor-pointer min-w-[100px]">{day.label}</Label>
                            </div>
                            <div>
                                <Input
                                    id={`time-${day.id}`}
                                    type="time"
                                    value={settings.gameDays[day.id]?.time || ''}
                                    onChange={(e) => handleTimeChange(day.id, e.target.value)}
                                    className="w-40"
                                    disabled={!settings.gameDays[day.id]?.selected}
                                />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                     <div className="pt-2 flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                  </div>
                )}
            </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-lg">
          <CardHeader>
              <CardTitle>Aplicativo</CardTitle>
              <CardDescription>
                  Gerencie as configurações gerais do aplicativo.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="flex items-center justify-center text-center p-8">
                  <p className="text-muted-foreground">Mais configurações do aplicativo em breve.</p>
              </div>
          </CardContent>
      </Card>
    </div>
  )
}
