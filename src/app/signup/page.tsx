
import { SignupForm } from "@/components/signup-form";
import { Suspense } from "react";

function SignupPageSkeleton() {
    return <div>Carregando...</div>
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<SignupPageSkeleton />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}

