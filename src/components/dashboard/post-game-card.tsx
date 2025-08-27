
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Goal } from "lucide-react";
import { GoalsDialog } from "@/components/goals-dialog";
import { cn } from "@/lib/utils";

interface PostGameCardProps {
    onSaveGoals: (goals: number) => Promise<void>;
    goalsCardState: { enabled: boolean; message: string };
}

export function PostGameCard({ onSaveGoals, goalsCardState }: PostGameCardProps) {
    const isDisabled = !goalsCardState.enabled;

    return (
        <Card className={cn(
            "shadow-lg h-fit text-center transition-opacity",
            isDisabled && "opacity-60 pointer-events-none"
        )}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3">
                <Goal className="h-6 w-6 text-primary" />
                <span>Pós-Jogo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <p className="text-muted-foreground text-sm h-8 flex items-center">{goalsCardState.message}</p>
              <GoalsDialog
                onSave={onSaveGoals}
                isDisabled={isDisabled}
              />
            </CardContent>
        </Card>
    );
}
