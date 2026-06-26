"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface KpiDashboard {
  period: { dateFrom: string; dateTo: string };
  leads: { total: number; converted: number; conversionRate: number };
  properties: { total: number; byStatus: { status: string; count: number }[] };
  bookings: { total: number; revenue: number };
  employees: { active: number };
  siteVisits: { total: number };
  incentives: { active: number };
  pendingLeaves: number;
  attendanceTrend: { date: string; present: number; absent: number; onLeave: number }[];
  departmentDistribution: { name: string; value: number }[];
}

export interface PipelineFunnel {
  leads: { status: string; count: number }[];
  siteVisits: { status: string; count: number }[];
  bookings: { status: string; count: number }[];
}

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => api.get<KpiDashboard>("/reports/kpi-dashboard"),
  });
}

export interface EmployeeAnalytics {
  employee: { id: string; employeeCode: string; user: { firstName: string; lastName: string }; department: { name: string } | null };
  metrics: { propertiesAssigned: number; leadsAssigned: number; siteVisitsCompleted: number; bookingsClosed: number; attendanceRate: number; conversionRate: number };
  assignments: { id: string; type: string; entityId: string; startDate: string | null; endDate: string | null }[];
  attendance: { id: string; date: string; status: string; checkIn: string | null; checkOut: string | null }[];
  performance: { id: string; year: number; quarter: number; score: number; notes: string | null }[];
  leaves: { id: string; type: string; status: string; startDate: string; endDate: string }[];
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
    queryFn: () => api.get<{ employees: { id: string; name: string; metrics: Record<string, number> }[] }>(`/analytics/team${departmentId ? `?departmentId=${departmentId}` : ""}`),
    enabled: !!departmentId,
  });
}

export function useConversionFunnel() {
  return useQuery({
    queryKey: ["analytics", "conversion-funnel"],
    queryFn: () => api.get<PipelineFunnel>("/reports/pipeline-funnel"),
  });
}

export function useBookingsByEmployee() {
  return useQuery({
    queryKey: ["analytics", "bookings-by-employee"],
    queryFn: () => api.get<{ name: string; bookings: number; closed: number }[]>("/analytics/bookings-by-employee"),
  });
}

export function useSiteVisitsByEmployee() {
  return useQuery({
    queryKey: ["analytics", "site-visits-by-employee"],
    queryFn: () => api.get<{ name: string; scheduled: number; completed: number }[]>("/analytics/site-visits-by-employee"),
  });
}
