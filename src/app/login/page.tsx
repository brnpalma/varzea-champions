
import { Suspense } from "react";
import { LoginPageContent } from "./login-page-content";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
