
"use client";

import { User } from "@/hooks/use-auth";
import { CardContent } from "@/components/ui/card";
import { Mail, Users, WalletCards } from "lucide-react";
import { ProfileActions } from "./profile-actions";

interface ProfileDetailsProps {
    user: User;
}

export function ProfileDetails({ user }: ProfileDetailsProps) {
    return (
        <CardContent className="space-y-4 pt-2">
            <div className="space-y-4 text-sm">
                <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground">
                        Grupo: <span className="font-medium capitalize text-primary">{user.groupName || "Nenhum grupo"}</span>
                    </span>
                </div>
                <div className="flex items-center">
                    <WalletCards className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-foreground">
                        Compromisso: <span className="font-medium capitalize text-primary">{user.playerSubscriptionType}</span>
                    </span>
                </div>
            </div>

            <ProfileActions user={user} />
        </CardContent>
    );
}
