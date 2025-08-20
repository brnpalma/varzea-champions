
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function MainLayout({ children, hideNav = false }: { children: React.ReactNode, hideNav?: boolean }) {
  return (
    <div className="flex h-screen bg-background">
      {!hideNav && <BottomNav />}
      <div className={`flex-1 flex flex-col ${!hideNav ? 'md:ml-64' : ''}`}>
        <main className="flex-1 overflow-y-auto">
          <div className={`${!hideNav ? 'pb-24 md:pb-0' : ''}`}>
             {children}
          </div>
        </main>
      </div>
      <ThemeToggle />
    </div>
  );
}
