
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function RankingPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Trophy className="h-7 w-7 text-amber-500" />
            <span>Ranking de Jogadores</span>
          </CardTitle>
          <CardDescription>
            Classificação dos artilheiros e os jogadores mais bem avaliados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-secondary/50">
            <p className="text-muted-foreground">
              A funcionalidade de ranking será implementada em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
