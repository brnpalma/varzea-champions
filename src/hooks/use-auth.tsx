
"use client";
import { useContext } from "react";
import { AuthContext, type AuthContextType, UserType, PlayerSubscriptionType, User as UserProfile } from "@/components/auth-provider";

// Re-export User with totalGoals property
export interface User extends UserProfile {
    totalGoals?: number;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { UserType, PlayerSubscriptionType };

    