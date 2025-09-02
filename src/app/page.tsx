
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { FootballSpinner } from '@/components/ui/football-spinner';
import { AuthProvider } from '@/components/auth-provider';

function RedirectPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication state is determined
    if (!loading) {
      if (user) {
        // If user is logged in, redirect to the dashboard
        router.replace('/inicio');
      } else {
        // If user is not logged in, redirect to the public landing page
        router.replace('/landing');
      }
    }
  }, [user, loading, router]);

  // Display a spinner while checking the auth state and redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <FootballSpinner />
    </div>
  );
}


export default function RedirectPage() {
  return (
     <AuthProvider>
        <RedirectPageContent />
    </AuthProvider>
  )
}
