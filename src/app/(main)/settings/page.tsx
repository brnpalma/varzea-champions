"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Configurações</CardTitle>
          <CardDescription>
            Gerencie as configurações da sua conta e preferências do aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-center text-center p-8">
                <p className="text-muted-foreground">Mais configurações em breve.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
