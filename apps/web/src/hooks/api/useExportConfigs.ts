"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  ExportConfig,
  CreateExportConfigDto,
  UpdateExportConfigDto,
} from "@/lib/types";

export function useExportConfigs() {
  return useQuery({
    queryKey: queryKeys.exportConfigs.all,
    queryFn: () => api.get<ExportConfig[]>("/reports/export-configs"),
  });
}

export function useExportConfig(id: string) {
  return useQuery({
    queryKey: queryKeys.exportConfigs.detail(id),
    queryFn: () => api.get<ExportConfig>(`/reports/export-configs/${id}`),
    enabled: !!id,
  });
}

export function useCreateExportConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExportConfigDto) =>
      api.post<ExportConfig>("/reports/export-configs", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.exportConfigs.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Create export config failed:", err.message),
  });
}

export function useUpdateExportConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExportConfigDto }) =>
      api.put<ExportConfig>(`/reports/export-configs/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.exportConfigs.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Update export config failed:", err.message),
  });
}

export function useDeleteExportConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean }>(`/reports/export-configs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.exportConfigs.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Delete export config failed:", err.message),
  });
}
