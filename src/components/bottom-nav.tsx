"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Settings, LogIn, LogOut, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sessão Encerrada",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair.",
      });
    }
  };
  
  const navItems = [
    { href: "/", label: "Início", icon: Home, requiresAuth: false },
    { href: "/profile", label: "Perfil", icon: User, requiresAuth: true },
    { href: "/appearance", label: "Aparência", icon: Palette, requiresAuth: false },
  ];

  const visibleNavItems = navItems.filter(item => !item.requiresAuth || user);

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-2 z-50">
        <div className="flex justify-around items-center">
          {visibleNavItems.map((item) => (
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
           {user ? (
              <button onClick={handleLogout} className="flex flex-col items-center justify-center gap-1 w-full p-2 rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-secondary">
                <LogOut className="h-5 w-5" />
                <span className="text-xs font-medium">Sair</span>
              </button>
            ) : (
              <Link href="/login" className="flex flex-col items-center justify-center gap-1 w-full p-2 rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-secondary">
                  <LogIn className="h-5 w-5" />
                  <span className="text-xs font-medium">Login</span>
              </Link>
            )}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r fixed h-full z-50">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <LogIn className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Várzea Champions</h1>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {visibleNavItems.map((item) => (
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
          {user ? (
            <div className="flex items-center gap-3">
              <User className="h-10 w-10 rounded-full bg-secondary p-2 text-secondary-foreground" />
              <div className="flex-1 truncate">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.displayName || "Usuário"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
             <Button asChild className="w-full">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4"/>
                  Fazer Login
                </Link>
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
