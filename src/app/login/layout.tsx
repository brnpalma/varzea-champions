
"use client";

import { useSearchParams } from "next/navigation";
import { AuthProvider } from "@/components/auth-provider";
import { MainLayout } from "@/components/main-layout";
import { Suspense } from "react";

function LoginLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const isInvite = searchParams.has('group_id');

  return (
    <AuthProvider>
      <MainLayout hideNav={isInvite}>{children}</MainLayout>
    </AuthProvider>
  );
}


export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <LoginLayoutContent>{children}</LoginLayoutContent>
    </Suspense>
  );
}
