"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  Quotation,
  QuotationQuery,
  QuotationAccessLog,
  CreateQuotationDto,
  UpdateQuotationStatusDto,
  PaginatedResponse,
} from "@/lib/types";

interface BackendQuotationResponse {
  items: Quotation[];
  meta: PaginatedResponse<Quotation>["meta"];
}

export function useQuotations(query: QuotationQuery = {}) {
  return useQuery({
    queryKey: ["quotations", query],
    queryFn: async () => {
      const res = await api.get<BackendQuotationResponse>("/quotations", query);
      return { data: res.items, meta: res.meta } as PaginatedResponse<Quotation>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ["quotation", id],
    queryFn: () => api.get<Quotation>(`/quotations/${id}`),
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateQuotationDto) =>
      api.post<Quotation>("/quotations", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (err: ApiError) =>
      console.error("Create quotation failed:", err.message),
  });
}

export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateQuotationStatusDto }) =>
      api.patch<Quotation>(`/quotations/${id}/status`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (err: ApiError) =>
      console.error("Update quotation status failed:", err.message),
  });
}

export function useQuotationAccessLogs(id: string) {
  return useQuery({
    queryKey: ["quotation-access-logs", id],
    queryFn: () =>
      api.get<QuotationAccessLog[]>(`/quotations/${id}/access-logs`),
    enabled: !!id,
  });
}

export function useDownloadQuotationPdf() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/proxy/quotations/${id}/download`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `Download failed with status ${response.status}`,
          response.status,
          errorData
        );
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotation-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}
