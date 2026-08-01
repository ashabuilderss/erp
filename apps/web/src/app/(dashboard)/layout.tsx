"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/api";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/ui/skeleton-variants";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/constants";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: currentUser, isLoading: roleLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <DashboardSkeleton />;
  }

  if (isError && !session?.user?.role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Failed to load profile</h2>
        <p className="text-muted-foreground mb-4">Could not verify your access. Please try signing in again.</p>
        <Button onClick={() => router.push("/sign-in")}>Back to Sign In</Button>
      </div>
    );
  }

  const dbRole = currentUser?.user?.role || session?.user?.role || "EMPLOYEE"
  const fName = currentUser?.user?.firstName || session?.user?.firstName || "";
  const lName = currentUser?.user?.lastName || session?.user?.lastName || "";
  const email = currentUser?.user?.email || session?.user?.email || "";

  if (roleLoading && !currentUser && !isError) {
    return <DashboardSkeleton />;
  }

  return (
    <AppShell role={dbRole as UserRole} user={{
      firstName: fName,
      lastName: lName,
      email,
      role: dbRole as UserRole,
    }}>
      {children}
      <InstallPrompt />
    </AppShell>
  );
}
