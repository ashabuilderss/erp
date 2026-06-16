"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/api";
import { useRouter } from "next/navigation";

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
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const dbRole = currentUser?.user?.role || session?.user?.role || "EMPLOYEE"
  const fName = currentUser?.user?.firstName || session?.user?.firstName || "";
  const lName = currentUser?.user?.lastName || session?.user?.lastName || "";
  const email = currentUser?.user?.email || session?.user?.email || "";

  if (roleLoading && !currentUser && !isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AppShell role={dbRole as "ADMIN" | "HR_MANAGER" | "EMPLOYEE"} user={{
      firstName: fName,
      lastName: lName,
      email,
      role: dbRole as "ADMIN" | "HR_MANAGER" | "EMPLOYEE",
    }}>
      {children}
    </AppShell>
  );
}
