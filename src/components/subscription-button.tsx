
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { SubscriptionDialog } from "@/components/profile/subscription-dialog";

export function SubscriptionButton() {
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsSubscriptionDialogOpen(true)} 
        className="w-full max-w-xs bg-amber-500 text-black hover:bg-amber-500/90"
      >
          <Crown className="mr-2 h-4 w-4" />
          Seja Assinante
      </Button>
      <SubscriptionDialog
          isOpen={isSubscriptionDialogOpen}
          setIsOpen={setIsSubscriptionDialogOpen}
      />
    </>
  );
}
