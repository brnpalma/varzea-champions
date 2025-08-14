
"use client";
import { useContext } from "react";
import { AuthContext, type AuthContextType, UserType, PlayerSubscriptionType, User } from "@/components/auth-provider";

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { UserType, PlayerSubscriptionType };
export type { User };
