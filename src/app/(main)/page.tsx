
"use client";

import { useAuth, UserType } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogIn } from "lucide-react";

import { EventCard } from "@/components/dashboard/event-card";
import { PostGameCard } from "@/components/dashboard/post-game-card";
import { EquipmentCard } from "@/components/dashboard/equipment-card";
import { FinancialCard } from "@/components/dashboard/financial-card";
import { useGameData } from "@/hooks/use-game-data";
import { usePostGame } from "@/hooks/use-post-game";
import { useEquipmentManager } from "@/hooks/use-equipment-manager";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";

export default function HomePage() {
  const { user, groupSettings, loading } = useAuth();
  
  const {
    nextGameDate,
    isGameDateLoading,
    isGameFinished,
    isConfirmationLocked,
    confirmedStatus,
    confirmedPlayers,
    confirmedPlayersCount,
    isFetchingPlayers,
    isSubmitting,
    handlePresenceClick
  } = useGameData(user, groupSettings);

  const {
    goalsCardState,
    handleSaveGoals
  } = usePostGame(user, groupSettings, nextGameDate);

  const { 
    equipmentManager, 
    isLoadingManager 
  } = useEquipmentManager(user, groupSettings, nextGameDate);

  const isManager = user?.userType === UserType.GESTOR_GRUPO;
  const showSubscriptionCard = isManager && user && !user.isSubscriber;

  const showPaymentCard = user && (groupSettings?.chavePix || groupSettings?.valorAvulso || groupSettings?.valorMensalidade);
  const showEquipmentCard = groupSettings?.enableEquipmentManager && user;
  const showPostGameCard = user && groupSettings?.gameDays && Object.values(groupSettings.gameDays).some(d => d.selected) && goalsCardState.visible;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {showSubscriptionCard && (
        <div className="mb-6">
           <SubscriptionCard user={user} />
        </div>
      )}

      <div className="space-y-4 mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {isGameFinished ? "Última Partida" : "Próxima Partida"}
        </h1>

        {!loading && !user && (
          <Card className="max-w-4xl mx-auto shadow-lg text-center">
            <CardHeader>
              <CardTitle>Bem-vindo ao Várzea Champions</CardTitle>
              <CardDescription>
                Faça login para gerenciar seu time, confirmar presença e muito mais.
              </CardDescription>
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
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <div className="md:col-span-2">
            <EventCard 
                user={user}
                nextGameDate={nextGameDate}
                isGameDateLoading={isGameDateLoading}
                isGameFinished={isGameFinished}
                confirmedStatus={confirmedStatus}
                isSubmitting={isSubmitting}
                isConfirmationLocked={isConfirmationLocked}
                onPresenceClick={handlePresenceClick}
                confirmedPlayers={confirmedPlayers}
                confirmedPlayersCount={confirmedPlayersCount}
                isFetchingPlayers={isFetchingPlayers}
                isManager={isManager}
            />
        </div>
        
        {showPostGameCard && (
          <PostGameCard 
            onSaveGoals={handleSaveGoals}
            goalsCardState={goalsCardState}
          />
        )}

        {showEquipmentCard && (
            <EquipmentCard
                isLoadingManager={isLoadingManager}
                equipmentManager={equipmentManager}
            />
        )}
        
        {showPaymentCard && groupSettings && (
           <div className="md:col-span-2">
            <FinancialCard groupSettings={groupSettings} />
          </div>
        )}
      </div>
      
    </div>
  );
}
