
"use client";

import { User } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2 } from "lucide-react";
import { InviteButton } from "../invite-button";

interface InviteCardProps {
    user: User | null;
    isManager: boolean;
}

export function InviteCard({ user, isManager }: InviteCardProps) {

    if (!isManager) {
        return null;
    }

    return (
        <Card className="shadow-lg h-fit text-center">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-3">
                <Share2 className="h-6 w-6 text-primary" />
                <span>Convidar Jogadores</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
                <InviteButton user={user} />
            </CardContent>
        </Card>
    );
}
