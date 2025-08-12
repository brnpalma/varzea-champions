"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, User, Settings } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Welcome back, {user?.displayName || "User"}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Here&apos;s your dashboard. Ready to dive in?
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <span>Your Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View and manage your personal information and authentication
              details.
            </p>
            <Button asChild>
              <Link href="/profile">
                Go to Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-accent" />
              <span>App Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Customize your application preferences and settings.
            </p>
            <Button asChild variant="secondary">
              <Link href="/settings">
                Go to Settings <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
