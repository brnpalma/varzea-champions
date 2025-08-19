
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function MainLayout({ children, hideNav = false }: { children: React.ReactNode, hideNav?: boolean }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex flex-1">
        {!hideNav && <BottomNav />}
        <main className={`flex-1 ${!hideNav ? 'pb-24 md:pb-0 md:ml-64' : ''}`}>
          {children}
        </main>
      </div>
      <ThemeToggle />
    </div>
  );
}
