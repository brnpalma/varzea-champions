
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Settings, LogIn, LogOut, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, UserType } from "@/hooks/use-auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "./user-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        variant: "success",
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
    { href: "/", label: "Início", icon: Home },
    { href: "/players", label: "Jogadores", icon: Users },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/settings", label: "Ajustes", icon: Settings, allowedRoles: [UserType.GESTOR_GRUPO, UserType.GESTOR_QUADRA] },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (loading) return false;
    // For logged in users, filter by role
    if (item.allowedRoles && (!user || !item.allowedRoles.includes(user.userType))) {
      return false;
    }
    return true;
  });

  const profileItem = user ? 
    { href: "/profile", label: "Perfil", icon: User, photoURL: user.photoURL } : 
    { href: "/login", label: "Login", icon: LogIn };

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
          <Link
              key={profileItem.href}
              href={profileItem.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full p-2 rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-secondary",
                pathname === profileItem.href && "text-primary bg-secondary"
              )}
            >
              {user ? (
                <UserAvatar src={user.photoURL} size={20} />
              ) : (
                <profileItem.icon className="h-5 w-5" />
              )}
              <span className="text-xs font-medium">{profileItem.label}</span>
            </Link>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r fixed h-full z-50">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Users className="h-6 w-6 text-primary-foreground" />
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
              <Link href="/profile" className="flex-1 flex items-center gap-3 truncate">
                <UserAvatar src={user.photoURL} size={40} />
                <div className="flex-1 truncate">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.displayName || "Usuário"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Sair">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza que deseja sair?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Você precisará fazer login novamente para acessar seu perfil e gerenciar seu time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLogout}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sair
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
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
