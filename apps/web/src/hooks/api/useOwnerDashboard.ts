"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  DashboardMetricsSnapshot,
  DashboardKpiSnapshot,
  DashboardAlert,
} from "@/lib/types";

export function useOwnerMetrics(date?: string) {
  return useQuery({
    queryKey: queryKeys.owner.metrics(date),
    queryFn: () =>
      api.get<DashboardMetricsSnapshot>("/dashboard/owner/metrics", {
        date,
      }),
  });
}

export function useOwnerKpi(date?: string) {
  return useQuery({
    queryKey: queryKeys.owner.kpi(date),
    queryFn: () =>
      api.get<DashboardKpiSnapshot>("/dashboard/owner/kpi", { date }),
  });
}

export function useOwnerAlerts(limit?: number) {
  return useQuery({
    queryKey: queryKeys.owner.alerts(limit),
    queryFn: () =>
      api.get<DashboardAlert[]>("/dashboard/owner/alerts", { limit }),
  });
}

export function useOwnerHistory(days?: number) {
  return useQuery({
    queryKey: queryKeys.owner.history(days),
    queryFn: () =>
      api.get<DashboardKpiSnapshot[]>("/dashboard/owner/history", { days }),
  });
}
