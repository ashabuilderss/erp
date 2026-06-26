"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/api";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/ui/skeleton-variants";

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

  const dbRole = currentUser?.user?.role || session?.user?.role || "EMPLOYEE"
  const fName = currentUser?.user?.firstName || session?.user?.firstName || "";
  const lName = currentUser?.user?.lastName || session?.user?.lastName || "";
  const email = currentUser?.user?.email || session?.user?.email || "";

  if (roleLoading && !currentUser && !isError) {
    return <DashboardSkeleton />;
  }

  return (
    <AppShell role={dbRole as "OWNER" | "ADMIN" | "HR_MANAGER" | "EMPLOYEE"} user={{
      firstName: fName,
      lastName: lName,
      email,
      role: dbRole as "OWNER" | "ADMIN" | "HR_MANAGER" | "EMPLOYEE",
    }}>
      {children}
    </AppShell>
  );
}
