
"use client";

import { User } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shirt } from "lucide-react";
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
                <CardTitle className="flex items-center justify-center gap-3">
                     <Shirt className="h-5 w-5 text-primary" />
                    <span>Próximo responsável</span>
                </CardTitle>
                 <CardDescription className="text-xs text-muted-foreground">
                    Pela limpeza do equipamento coletivo
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-2 pt-0">
                {isLoadingManager ? (
                    <FootballSpinner />
                ) : equipmentManager.next ? (
                    <>
                        <UserAvatar src={equipmentManager.next.photoURL} size={64} />
                        <p className="text-lg font-bold text-foreground">{equipmentManager.next.displayName}</p>
                    </>
                ) : (
                    <p className="text-muted-foreground">Nenhum jogador no grupo para definir um responsável.</p>
                )}
            </CardContent>
        </Card>
    );
}

    