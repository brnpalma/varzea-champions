
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex flex-1">
        <BottomNav />
        <main className="flex-1 pb-24 md:pb-0 md:ml-64">
          {children}
        </main>
      </div>
      <ThemeToggle />
    </div>
  );
}
