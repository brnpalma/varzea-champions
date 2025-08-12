import { BottomNav } from "@/components/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <BottomNav />
      <main className="flex-1 pb-24 md:pb-0 md:ml-64">{children}</main>
    </div>
  );
}
