
"use client";

import { cn } from "@/lib/utils";

interface AuthToggleProps {
  authMode: "login" | "signup";
  setAuthMode: (mode: "login" | "signup") => void;
}

export function AuthToggle({ authMode, setAuthMode }: AuthToggleProps) {
  return (
    <div className="w-full bg-muted p-1 rounded-full flex items-center justify-center relative">
      <div
        className={cn(
          "absolute left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-background rounded-full transition-transform duration-300 ease-in-out",
          authMode === "signup" && "translate-x-full"
        )}
      />
      <button
        type="button"
        onClick={() => setAuthMode("login")}
        className={cn(
          "w-1/2 z-10 py-2 rounded-full text-sm font-semibold transition-colors",
          authMode === "login" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => setAuthMode("signup")}
        className={cn(
          "w-1/2 z-10 py-2 rounded-full text-sm font-semibold transition-colors",
          authMode === "signup" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Cadastrar
      </button>
    </div>
  );
}
