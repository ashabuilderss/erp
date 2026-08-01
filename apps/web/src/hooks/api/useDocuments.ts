"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  DocumentRegistry,
  DocumentAccessLog,
  DocumentAccessStats,
  QueryDocumentsDto,
  RegisterDocumentDto,
  QueryDocumentAccessLogsDto,
  PaginatedResponse,
} from "@/lib/types";

export function useDocuments(query: QueryDocumentsDto = {}) {
  return useQuery({
    queryKey: queryKeys.documents.list(query),
    queryFn: () =>
      api.get<PaginatedResponse<DocumentRegistry>>("/documents", query),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: queryKeys.documents.detail(id),
    queryFn: () => api.get<DocumentRegistry>(`/documents/${id}`),
    enabled: !!id,
  });
}

export function useDocumentAccessLogs(
  id: string,
  query: QueryDocumentAccessLogsDto = {},
) {
  return useQuery({
    queryKey: queryKeys.documents.accessLogs(id, query),
    queryFn: () =>
      api.get<PaginatedResponse<DocumentAccessLog>>(
        `/documents/${id}/access-logs`,
        query,
      ),
    enabled: !!id,
  });
}

export function useDocumentAccessStats(id: string) {
  return useQuery({
    queryKey: queryKeys.documents.accessStats(id),
    queryFn: () =>
      api.get<DocumentAccessStats>(`/documents/${id}/access-stats`),
    enabled: !!id,
  });
}

export function useRegisterDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RegisterDocumentDto) =>
      api.post<DocumentRegistry>("/documents", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Register document failed:", err.message),
  });
}

export function useLogDocumentAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { documentId: string; action: string }) =>
      api.post<{ id: string }>("/documents/access", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Log document access failed:", err.message),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ success: boolean }>(`/documents/${id}/delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Delete document failed:", err.message),
  });
}
