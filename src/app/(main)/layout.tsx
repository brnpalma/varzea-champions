
import { AuthProvider } from "@/components/auth-provider";
import { MainLayout } from "@/components/main-layout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <MainLayout>{children}</MainLayout>
    </AuthProvider>
  );
}
