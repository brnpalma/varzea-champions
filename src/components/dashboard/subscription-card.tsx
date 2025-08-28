
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { SubscriptionDialog } from "@/components/profile/subscription-dialog";
import { User } from "@/hooks/use-auth";

interface SubscriptionCardProps {
    user: User;
}

export function SubscriptionCard({ user }: SubscriptionCardProps) {
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);

    return (
        <>
            <Card className="shadow-lg text-center bg-secondary/30 border-primary/20">
                <CardHeader className="items-center pb-2">
                    <div className="p-3 rounded-full bg-amber-500/20 text-amber-500">
                       <Crown className="h-8 w-8" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <CardTitle>Torne-se um Assinante</CardTitle>
                        <CardDescription className="mt-2">
                            Acesse recursos exclusivos para uma gestão completa e profissional do seu grupo.
                        </CardDescription>
                    </div>
                    <Button
                        onClick={() => setIsSubscriptionDialogOpen(true)}
                        className="w-full max-w-xs bg-amber-500 text-black hover:bg-amber-500/90"
                        size="lg"
                    >
                        Assinar Agora
                    </Button>
                </CardContent>
            </Card>
            <SubscriptionDialog
                user={user}
                isOpen={isSubscriptionDialogOpen}
                setIsOpen={setIsSubscriptionDialogOpen}
            />
        </>
    );
}
