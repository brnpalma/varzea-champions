
"use client";

import { useAuth, UserType } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { FootballSpinner } from "@/components/ui/football-spinner";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileDetails } from "@/components/profile/profile-details";
import { GroupSettings } from "@/components/profile/group-settings";
import packageJson from '../../../../package.json';

export default function ProfilePage() {
  const { user, loading, groupSettings } = useAuth();
  const appVersion = packageJson.version;
  const isManager = user?.userType === UserType.GESTOR_GRUPO || user?.userType === UserType.GESTOR_QUADRA;

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center h-full">
        <FootballSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto shadow-lg text-center">
          <CardHeader>
            <CardTitle>Acesse seu Perfil</CardTitle>
            <CardDescription>Faça login para ver e gerenciar os detalhes do seu perfil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/login">
                <LogIn className="mr-2" />
                Fazer Login ou Criar Conta
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card className="shadow-lg">
          <ProfileHeader user={user} />
          <ProfileDetails user={user} />
        </Card>

        {isManager && (
          <GroupSettings 
            user={user} 
            groupSettings={groupSettings}
          />
        )}
      </div>
      <div className="md:hidden text-center text-sm text-muted-foreground mt-8">
        Versão {appVersion}
      </div>
    </div>
  );
}
