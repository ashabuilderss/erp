"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export interface CreateExpenseClaimDto {
  amount: number;
  category: string;
  description?: string;
  expenseDate: string;
}

export function useExpenseClaims(query: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["expense-claims", query],
    queryFn: () => api.get<{ data: any[]; meta: any }>("/expense-claims", query),
  });
}

export function useMyExpenseClaims() {
  return useQuery({
    queryKey: ["expense-claims", "my"],
    queryFn: () => api.get<any[]>("/expense-claims/my"),
  });
}

export function useCreateExpenseClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExpenseClaimDto) =>
      api.post("/expense-claims", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
    },
  });
}

export function useApproveExpenseClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.patch(`/expense-claims/${id}/approve`, { status: "APPROVED", notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
    },
    onError: (err: ApiError) => console.error("Approve expense claim failed:", err.message),
  });
}

export function useRejectExpenseClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.patch(`/expense-claims/${id}/approve`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
    },
    onError: (err: ApiError) => console.error("Reject expense claim failed:", err.message),
  });
}
