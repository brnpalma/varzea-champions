
"use client";

import { User } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shirt, Sparkles } from "lucide-react";
import { FootballSpinner } from "@/components/ui/football-spinner";
import { UserAvatar } from "@/components/user-avatar";

interface EquipmentCardProps {
    isLoadingManager: boolean;
    equipmentManager: { next: User | null };
}

export function EquipmentCard({ isLoadingManager, equipmentManager }: EquipmentCardProps) {
    return (
        <Card className="shadow-lg h-fit text-center">
            <CardHeader className="text-center">
                <CardTitle className="flex flex-col sm:flex-row items-center justify-center gap-3">
                     <div className="flex items-center gap-2">
                        <Shirt className="h-5 w-5 text-primary" />
                        <Sparkles className="h-5 w-5 text-primary" />
                     </div>
                    <span>Equipamento</span>
                </CardTitle>
                 <CardDescription className="text-xs text-muted-foreground">
                    Próximo responsável pela limpeza
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-2 pt-0">
                {isLoadingManager ? (
                    <FootballSpinner />
                ) : equipmentManager.next ? (
                    <>
                        <UserAvatar src={equipmentManager.next.photoURL} size={64} />
                        <p className="text-lg font-bold text-foreground mt-2">{equipmentManager.next.displayName}</p>
                    </>
                ) : (
                    <p className="text-muted-foreground">Nenhum jogador no grupo para definir um responsável.</p>
                )}
            </CardContent>
        </Card>
    );
}
