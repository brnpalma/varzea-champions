
"use client";

import { useState, useEffect } from "react";
import { User, UserType, GroupSettings as GroupSettingsType } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";
import { FootballSpinner } from "../ui/football-spinner";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

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

interface GroupSettingsProps {
    user: User;
    groupSettings: GroupSettingsType | null;
}

export function GroupSettings({ user, groupSettings }: GroupSettingsProps) {
    const { toast } = useToast();
    const [settings, setSettings] = useState<{
        gameDays: Record<string, GameDaySetting>;
    }>({
        gameDays: Object.fromEntries(daysOfWeek.map(day => [day.id, { selected: false, time: '' }]))
    });
    const [groupName, setGroupName] = useState("");
    const [playersPerTeam, setPlayersPerTeam] = useState<number>(5);
    const [valorMensalidade, setValorMensalidade] = useState<number | ''>('');
    const [valorAvulso, setValorAvulso] = useState<number | ''>('');
    const [chavePix, setChavePix] = useState("");
    const [allowConfirmationWithDebt, setAllowConfirmationWithDebt] = useState(false);
    const [enableEquipmentManager, setEnableEquipmentManager] = useState(false);
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const isGroupManager = user?.userType === UserType.GESTOR_GRUPO;
    const groupId = user?.groupId;

    useEffect(() => {
        if (!groupId) {
          setIsSettingsLoading(false);
          return;
        }
    
        if (groupSettings === null && isSettingsLoading) {
            setIsSettingsLoading(false);
            return;
        }
    
        if (groupSettings) {
          if (groupSettings.gameDays) {
            const loadedSettings = groupSettings.gameDays;
            const mergedGameDays: Record<string, GameDaySetting> = {};
            daysOfWeek.forEach(day => {
                mergedGameDays[day.id] = loadedSettings[day.id] || { selected: false, time: '' };
            });
            setSettings({ gameDays: mergedGameDays });
          }
          setGroupName(groupSettings.name || "");
          setPlayersPerTeam(groupSettings.playersPerTeam || 5);
          setValorMensalidade(groupSettings.valorMensalidade || '');
          setValorAvulso(groupSettings.valorAvulso || '');
          setChavePix(groupSettings.chavePix || "");
          setAllowConfirmationWithDebt(groupSettings.allowConfirmationWithDebt ?? false);
          setEnableEquipmentManager(groupSettings.enableEquipmentManager ?? false);
          setIsSettingsLoading(false);
        }
        
    }, [groupId, groupSettings, isSettingsLoading]);
    
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

    const handleSaveSettings = async () => {
        if (!user || !groupId) return;
    
        if (isGroupManager && !groupName.trim()) {
            toast({
                variant: "destructive",
                title: "Campo Obrigatório",
                description: "O nome do grupo não pode estar vazio.",
            });
            return;
        }
    
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
    
        setIsSavingSettings(true);
        try {
          const groupDocRef = doc(firestore, "groups", groupId);
          
          const dataToUpdate: any = {
              gameDays: settings.gameDays,
              playersPerTeam: playersPerTeam,
              valorMensalidade: Number(valorMensalidade) || null,
              valorAvulso: Number(valorAvulso) || null,
              chavePix: chavePix.trim() || null,
              allowConfirmationWithDebt: allowConfirmationWithDebt,
              enableEquipmentManager: enableEquipmentManager,
          };
    
          if (isGroupManager) {
              dataToUpdate.name = groupName.trim();
          }
    
          await setDoc(groupDocRef, dataToUpdate, { merge: true });
    
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
          setIsSavingSettings(false);
        }
      };

    return (
        <div>
            <Label className="text-base font-semibold text-muted-foreground">Configurações</Label>
            <Card className="shadow-lg mt-2">
                <CardHeader>
                    <CardTitle>Grupo</CardTitle>
                    <CardDescription>
                        Gerencie as configurações dos jogos e do seu grupo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSettingsLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <FootballSpinner />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {isGroupManager && (
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="group-name">Nome do Grupo</Label>
                                        <Input
                                            id="group-name"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            placeholder="Digite o nome do grupo"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="players-per-team">Jogadores por Time</Label>
                                    <Input
                                        id="players-per-team"
                                        type="number"
                                        value={playersPerTeam}
                                        onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
                                        placeholder="Nº de jogadores"
                                        min="2"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-base">Financeiro</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="valor-mensalidade">Valor Mensal (R$)</Label>
                                        <Input
                                            id="valor-mensalidade"
                                            type="number"
                                            value={valorMensalidade}
                                            onChange={(e) => setValorMensalidade(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="Ex: 100.00"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="valor-avulso">Valor Avulso (R$)</Label>
                                        <Input
                                            id="valor-avulso"
                                            type="number"
                                            value={valorAvulso}
                                            onChange={(e) => setValorAvulso(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="Ex: 25.00"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 pt-4">
                                    <Label htmlFor="chave-pix">Chave PIX</Label>
                                    <Input
                                        id="chave-pix"
                                        value={chavePix}
                                        onChange={(e) => setChavePix(e.target.value)}
                                        placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                                    />
                                </div>
                                <div className="flex items-start pt-4">
                                    <div className="flex items-center h-5">
                                        <Checkbox
                                            id="allow-debt"
                                            checked={allowConfirmationWithDebt}
                                            onCheckedChange={(checked) => setAllowConfirmationWithDebt(Boolean(checked))}
                                        />
                                    </div>
                                    <div className="ml-2 text-sm">
                                        <Label htmlFor="allow-debt" className="text-xs text-muted-foreground cursor-pointer">
                                            Permitir confirmação de presença com pendência financeira
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-base">Controle de Equipamentos</Label>
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <Checkbox
                                            id="enable-equipment-manager"
                                            checked={enableEquipmentManager}
                                            onCheckedChange={(checked) => setEnableEquipmentManager(Boolean(checked))}
                                        />
                                    </div>
                                    <div className="ml-2 text-sm">
                                        <Label htmlFor="enable-equipment-manager" className="text-xs text-muted-foreground cursor-pointer">
                                            Ativar controle do responsável da semana pela limpeza dos coletes (ou equipamento coletivo em geral)
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-base">Dias e Horários</Label>
                                <p className="text-sm text-muted-foreground mb-4">Selecione os dias e horários dos jogos.</p>
                                <div className="space-y-4">
                                    {daysOfWeek.map((day) => (
                                        <div key={day.id} className="flex flex-row items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={day.id}
                                                    checked={!!settings.gameDays[day.id]?.selected}
                                                    onCheckedChange={() => handleDayChange(day.id)}
                                                />
                                                <Label htmlFor={day.id} className="font-normal cursor-pointer min-w-[100px]">{day.label}</Label>
                                            </div>
                                            {settings.gameDays[day.id]?.selected && (
                                                <div className="w-auto">
                                                    <Input
                                                        id={`time-${day.id}`}
                                                        type="time"
                                                        step="1800" // 30 minutos em segundos
                                                        value={settings.gameDays[day.id]?.time || ''}
                                                        onChange={(e) => handleTimeChange(day.id, e.target.value)}
                                                        className="w-32 sm:w-40"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isSavingSettings ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
