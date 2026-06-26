"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export function useExpenseClaims(query: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["expense-claims", query],
    queryFn: () => api.get<{ data: any[]; meta: any }>("/expense-claims", query),
  });
}

export function useApproveExpenseClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.post(`/expense-claims/${id}/approve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
    },
    onError: (err: ApiError) => console.error("Approve expense claim failed:", err.message),
  });
}

export function useRejectExpenseClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.post(`/expense-claims/${id}/reject`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
    },
    onError: (err: ApiError) => console.error("Reject expense claim failed:", err.message),
  });
}
