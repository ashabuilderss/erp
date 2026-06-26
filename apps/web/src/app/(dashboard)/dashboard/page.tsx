"use client";

import { ErrorBoundary } from "react-error-boundary";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { HRDashboard } from "@/components/dashboard/hr-dashboard";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ErrorFallback } from "@/components/shared/error-fallback";
import { useCurrentUser } from "@/hooks/api";

export default function DashboardPage() {
  const { data: currentUser, isLoading } = useCurrentUser();

  if (isLoading) return <DashboardSkeleton />;

  const role = currentUser?.user?.role || "EMPLOYEE";

  const dashboard = role === "OWNER" ? <OwnerDashboard /> : role === "HR_MANAGER" ? <HRDashboard /> : role === "EMPLOYEE" ? <EmployeeDashboard /> : <AdminDashboard />;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      {dashboard}
    </ErrorBoundary>
  );
}
