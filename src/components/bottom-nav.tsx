"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Settings, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "./ui/button";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/settings", label: "Config.", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-2 z-50">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full p-2 rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-secondary",
                pathname === item.href && "text-primary bg-secondary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r fixed h-full z-50">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">AuthFlow</h1>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-secondary",
                pathname === item.href && "bg-secondary text-primary font-semibold"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          {user && (
            <div className="flex items-center gap-3">
              <User className="h-10 w-10 rounded-full bg-secondary p-2 text-secondary-foreground" />
              <div className="flex-1 truncate">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.displayName || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
                <Lock className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
