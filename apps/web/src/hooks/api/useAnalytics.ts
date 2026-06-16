"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AnalyticsDashboard, EmployeeAnalytics, TeamAnalytics, ConversionFunnel } from "@/lib/types";

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => api.get<AnalyticsDashboard>("/analytics/dashboard"),
  });
}

export function useEmployeeAnalytics(employeeId: string) {
  return useQuery({
    queryKey: ["analytics", "employee", employeeId],
    queryFn: () => api.get<EmployeeAnalytics>(`/analytics/employee/${employeeId}`),
    enabled: !!employeeId,
  });
}

export function useTeamAnalytics(departmentId?: string) {
  return useQuery({
    queryKey: ["analytics", "team", departmentId],
    queryFn: () => api.get<TeamAnalytics>(`/analytics/team${departmentId ? `?departmentId=${departmentId}` : ""}`),
    enabled: !!departmentId,
  });
}

export function useConversionFunnel() {
  return useQuery({
    queryKey: ["analytics", "conversion-funnel"],
    queryFn: () => api.get<ConversionFunnel>("/analytics/conversion-funnel"),
  });
}