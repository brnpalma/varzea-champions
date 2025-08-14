
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shuffle } from "lucide-react";

export default function SorterPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Shuffle className="h-7 w-7 text-primary" />
            <span>Sorteador de Times</span>
          </CardTitle>
          <CardDescription>
            Gere times equilibrados para a sua partida de forma rápida e justa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-secondary/50">
            <p className="text-muted-foreground">
              A funcionalidade de sorteio de times será implementada em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
