"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SopDocument, TrainingRecord, CreateSopDocumentDto, CreateTrainingRecordDto, PaginatedResponse } from "@/lib/types";

export function useSopDocuments(query: { page?: number; limit?: number; departmentId?: string; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: ["sop-documents", query],
    queryFn: () => api.get<PaginatedResponse<SopDocument>>("/training/sops", query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSopDocument(id: string) {
  return useQuery({
    queryKey: ["sop-document", id],
    queryFn: () => api.get<SopDocument>(`/training/sops/${id}`),
    enabled: !!id,
  });
}

export function useTrainingRecords(query: { page?: number; limit?: number; employeeId?: string; sopDocumentId?: string } = {}) {
  return useQuery({
    queryKey: ["training-records", query],
    queryFn: () => api.get<PaginatedResponse<TrainingRecord>>("/training/records", query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSopDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSopDocumentDto) => api.post<SopDocument>("/training/sops", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sop-documents"] }),
  });
}

export function useUpdateSopDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch<SopDocument>(`/training/sops/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sop-documents"] }),
  });
}

export function useDeleteSopDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/training/sops/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sop-documents"] }),
  });
}

export function useAcknowledgeSop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/training/sops/${id}/acknowledge`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sop-documents"] }),
  });
}

export function useCreateTrainingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTrainingRecordDto) => api.post<TrainingRecord>("/training/records", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-records"] }),
  });
}
