"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ActivityLog, PaginatedResponse, QueryParams } from "@/lib/types";

export function useActivityLogs(query: QueryParams = {}) {
  return useQuery({
    queryKey: ["activity-logs", query],
    queryFn: () => api.get<PaginatedResponse<ActivityLog>>("/activity-logs", query),
  });
}
