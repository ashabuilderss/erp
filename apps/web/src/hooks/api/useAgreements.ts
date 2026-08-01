"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Agreement, AgreementQuery, CreateAgreementDto, PaginatedResponse } from "@/lib/types";

export function useAgreements(query: AgreementQuery = {}) {
  return useQuery({
    queryKey: ["agreements", query],
    queryFn: () => api.get<PaginatedResponse<Agreement>>("/agreements", query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAgreement(id: string) {
  return useQuery({
    queryKey: ["agreement", id],
    queryFn: () => api.get<Agreement>(`/agreements/${id}`),
    enabled: !!id,
  });
}

export function useCreateAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAgreementDto) => api.post<Agreement>("/agreements", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agreements"] }),
  });
}

export function useUpdateAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch<Agreement>(`/agreements/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agreements"] }),
  });
}

export function useDeleteAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agreements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agreements"] }),
  });
}

export function useSubmitAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Agreement>(`/agreements/${id}/submit`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agreements"] }),
  });
}

export function useApproveAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { comments?: string } }) =>
      api.post<Agreement>(`/agreements/${id}/approve`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agreements"] }),
  });
}
