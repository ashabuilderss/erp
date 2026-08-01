"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  ReportExport,
  ReportExportWithBuffer,
  QueryReportExportsDto,
  CreateReportExportDto,
  PaginatedResponse,
} from "@/lib/types";

export function useExportHistory(query: QueryReportExportsDto = {}) {
  return useQuery({
    queryKey: queryKeys.exportHistory.list(query),
    queryFn: () =>
      api.get<PaginatedResponse<ReportExport>>("/reports/export-history", query),
  });
}

export function useCreateExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReportExportDto) =>
      api.post<ReportExportWithBuffer>("/reports/exports", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reportExports.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.exportHistory.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Create export failed:", err.message),
  });
}
