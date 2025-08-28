
"use client";

import { useState } from "react";
import { User, UserType } from "@/hooks/use-auth";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { Star, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import { SubscriptionDialog } from "./subscription-dialog";

interface ProfileHeaderProps {
    user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
    const currentUserRating = user.rating || 1;
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
    const isManager = user.userType === UserType.GESTOR_GRUPO || user.userType === UserType.GESTOR_QUADRA;

    return (
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                <div className="flex flex-col items-center sm:flex-row sm:items-start space-x-0 sm:space-x-4 w-full">
                    <div className="relative shrink-0">
                        <UserAvatar src={user.photoURL} size={80} />
                    </div>
                    <div className="mt-2 sm:mt-0 text-center sm:text-left flex-1">
                        <div className="flex flex-col items-center sm:items-start gap-2">
                            <CardTitle className="text-2xl">{user.displayName || "Perfil do Usuário"}</CardTitle>
                            <div className="flex items-center text-amber-500">
                                {[...Array(currentUserRating)].map((_, i) => <Star key={`filled-${i}`} className="h-5 w-5 fill-current" />)}
                                {[...Array(5 - currentUserRating)].map((_, i) => <Star key={`empty-${i}`} className="h-5 w-5 text-muted-foreground/30" />)}
                            </div>
                            {isManager && (
                                <div className="mt-2 flex justify-center sm:justify-start">
                                    {user.isSubscriber ? (
                                        <Badge variant="success">Assinante</Badge>
                                    ) : (
                                        <Badge variant="destructive">Não Assinante</Badge>
                                    )
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isManager && !user.isSubscriber && (
                <div className="pt-2 text-center">
                    <Button 
                      onClick={() => setIsSubscriptionDialogOpen(true)} 
                      className="w-full max-w-xs bg-amber-500 text-black hover:bg-amber-500/90"
                    >
                        <Crown className="mr-2 h-4 w-4" />
                        Seja Assinante
                    </Button>
                </div>
            )}
             <SubscriptionDialog
                isOpen={isSubscriptionDialogOpen}
                setIsOpen={setIsSubscriptionDialogOpen}
            />
        </CardHeader>
    );
}
