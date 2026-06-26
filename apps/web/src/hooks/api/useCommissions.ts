"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PipelineCommission } from "@/lib/types";

export function useCommissions(query = {}) {
  return useQuery({ queryKey: ["commissions", query], queryFn: () => api.get<{ data: PipelineCommission[]; meta: any }>("/commissions", query) });
}

export function useCommission(id: string) {
  return useQuery({ queryKey: ["commission", id], queryFn: () => api.get<PipelineCommission>(`/commissions/${id}`), enabled: !!id });
}

export function useCreateCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { employeeId: string; amount: number; percentage?: number; leadId?: string; bookingId?: string; notes?: string }) => api.post("/commissions", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commissions"] }),
  });
}

export function useUpdateCommissionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/commissions/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commissions"] }),
  });
}
