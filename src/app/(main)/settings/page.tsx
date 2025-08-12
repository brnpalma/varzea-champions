import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Brush, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
       <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle className="text-2xl">Configurações</CardTitle>
            <CardDescription>Gerencie as configurações do seu aplicativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center"><Palette className="mr-2 h-5 w-5"/> Aparência</h3>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="dark-mode">Modo Escuro</Label>
                        <p className="text-sm text-muted-foreground">
                            Ative o modo escuro para o aplicativo.
                        </p>
                    </div>
                    <Switch id="dark-mode" disabled aria-label="Ativar modo escuro (em breve)" />
                </div>
                <p className="text-xs text-center text-muted-foreground">Mais configurações em breve!</p>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
