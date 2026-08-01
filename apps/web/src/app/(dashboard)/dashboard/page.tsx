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

  let dashboard = <EmployeeDashboard />;
  if (role === "OWNER") {
    dashboard = <OwnerDashboard />;
  } else if (role === "ADMIN" || role === "ACCOUNTS") {
    dashboard = <AdminDashboard />;
  } else if (role === "HR_MANAGER") {
    dashboard = <HRDashboard />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      {dashboard}
    </ErrorBoundary>
  );
}
