
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight } from "lucide-react";

export function RankingCard() {
    return (
        <Card className="shadow-lg h-fit text-center">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-3">
                    <Trophy className="h-6 w-6 text-amber-500" />
                    <span>Ranking</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">
                    Veja a classificação de estrelas e artilheiros
                </p>
                <Button asChild>
                    <Link href="/ranking">
                        Acessar Ranking <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

    