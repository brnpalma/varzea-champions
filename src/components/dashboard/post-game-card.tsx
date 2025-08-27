
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Goal } from "lucide-react";
import { GoalsDialog } from "@/components/goals-dialog";

interface PostGameCardProps {
    onSaveGoals: (goals: number) => Promise<void>;
    goalsCardState: { visible: boolean; enabled: boolean };
}

export function PostGameCard({ onSaveGoals, goalsCardState }: PostGameCardProps) {
    return (
        <Card className="shadow-lg h-fit text-center">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3">
                <Goal className="h-6 w-6 text-primary" />
                <span>Pós-Jogo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <p className="text-muted-foreground">Quantos gols você marcou hoje?</p>
              <GoalsDialog
                onSave={onSaveGoals}
                isDisabled={!goalsCardState.enabled}
              />
            </CardContent>
        </Card>
    );
}

    