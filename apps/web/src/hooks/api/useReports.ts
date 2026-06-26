"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useReportCatalog() {
  return useQuery({
    queryKey: ["report-catalog"],
    queryFn: () =>
      api.get<{
        items: Array<{ key: string; title: string; description: string; entities: string[] }>;
        note?: string;
      }>("/reports/catalog"),
  });
}

export function useReportExports() {
  return useQuery({
    queryKey: ["report-exports"],
    queryFn: () =>
      api.get<{ data: Array<{ id: string; title: string; status: string; summary: string }>; meta: { total: number; page: number; limit: number; totalPages: number } }>("/reports/exports"),
  });
}

export function useCreateReportExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { reportKey: string; format: string }) =>
      api.post("/reports/exports", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-exports"] });
    },
  });
}
