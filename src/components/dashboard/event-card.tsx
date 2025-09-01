
"use client";

import { User } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Check, X, CheckCircle } from "lucide-react";
import { FootballSpinner } from "@/components/ui/football-spinner";
import { ConfirmedPlayersDialog } from "@/components/confirmed-players-dialog";
import { InviteButton } from "../invite-button";
import { cn } from "@/lib/utils";

interface EventCardProps {
    user: User | null;
    nextGameDate: Date | null;
    isGameDateLoading: boolean;
    isGameFinished: boolean;
    confirmedStatus: 'confirmed' | 'declined' | null;
    isSubmitting: boolean;
    isConfirmationLocked: boolean;
    onPresenceClick: (status: 'confirmed' | 'declined') => void;
    confirmedPlayers: User[];
    confirmedPlayersCount: number;
    isFetchingPlayers: boolean;
    isManager: boolean | undefined;
}

export function EventCard({
    user,
    nextGameDate,
    isGameDateLoading,
    isGameFinished,
    confirmedStatus,
    isSubmitting,
    isConfirmationLocked,
    onPresenceClick,
    confirmedPlayers,
    confirmedPlayersCount,
    isFetchingPlayers,
    isManager
}: EventCardProps) {
    const formatNextGameDate = (date: Date | null) => {
        if (!date) {
            return {
                line1: "Nenhuma partida agendada.",
                line2: null,
            };
        }

        const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);

        const dateTime = new Intl.DateTimeFormat('pt-BR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date).replace(', ', ' as ');

        return {
            line1: weekday.charAt(0).toUpperCase() + weekday.slice(1).replace(',', ''),
            line2: dateTime
        }
    };

    const formattedDate = formatNextGameDate(nextGameDate);

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
                 <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Calendar className="h-6 w-6 text-primary shrink-0" />
                    {isGameDateLoading ? (
                    <div className="w-full flex justify-center items-center py-4">
                        <FootballSpinner />
                    </div>
                    ) : (
                    <div className="flex flex-col text-center sm:text-left">
                        <span className="text-xl font-bold">{formattedDate.line1}</span>
                        {formattedDate.line2 && <span className="text-base font-medium text-muted-foreground">{formattedDate.line2}</span>}
                    </div>
                    )}
                 </div>

                {isGameFinished && (
                    <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-semibold">Realizado</span>
                    </div>
                )}

                 {!isGameFinished && user && (
                    <div className="flex-1 flex flex-col items-center sm:items-end w-full sm:w-auto">
                        <p className="text-muted-foreground text-sm mb-2">Confirma sua presença?</p>
                        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                            <Button 
                                onClick={() => onPresenceClick('confirmed')} 
                                className={cn(
                                    "bg-green-600 hover:bg-green-700 text-white",
                                    confirmedStatus === 'confirmed' && "bg-secondary text-secondary-foreground hover:bg-secondary"
                                )}
                                disabled={isSubmitting || !nextGameDate || confirmedStatus === 'confirmed' || isConfirmationLocked}
                            >
                                <Check className="mr-2 h-4 w-4" /> Sim
                            </Button>
                            <Button 
                                onClick={() => onPresenceClick('declined')} 
                                variant={confirmedStatus === 'declined' || confirmedStatus === null ? 'secondary' : 'destructive'}
                                disabled={isSubmitting || !nextGameDate || confirmedStatus === 'declined' || confirmedStatus === null || isConfirmationLocked}
                            >
                                <X className="mr-2 h-4 w-4" /> Não
                            </Button>
                        </div>
                    </div>
                 )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex flex-col items-center justify-center gap-4 pt-2">
                    {!isGameFinished && (
                        <ConfirmedPlayersDialog 
                            confirmedPlayers={confirmedPlayers}
                            confirmedPlayersCount={confirmedPlayersCount}
                            isFetchingPlayers={isFetchingPlayers}
                        />
                    )}
                    {isManager && (
                        <InviteButton user={user} size="lg" />
                    )}
                </div>
                 {isGameFinished && (
                     <p className="text-sm text-center text-muted-foreground pt-4">
                        A confirmação para este jogo foi encerrada.
                    </p>
                 )}
                 {!user && (
                    <p className="text-sm text-center text-muted-foreground pt-4">
                      Você precisa fazer login para confirmar sua presença.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
