
"use client";

import { AuthProvider } from "@/components/auth-provider";
import { MainLayout } from "@/components/main-layout";

export default function LoginLayout({
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
