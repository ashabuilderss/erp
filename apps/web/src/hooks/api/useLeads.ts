"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Lead, LeadQuery, CreateLeadDto, PaginatedResponse, UpdateLeadDto } from "@/lib/types";

export function useLeads(query: LeadQuery = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["leads", query],
    queryFn: () => api.get<PaginatedResponse<Lead>>("/leads", query),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => api.get<Lead>(`/leads/${id}`),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeadDto) => api.post<Lead>("/leads", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: ApiError) => console.error("Create lead failed:", err.message),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLeadDto }) =>
      api.patch<Lead>(`/leads/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: ApiError) => console.error("Update lead failed:", err.message),
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<Lead>(`/leads/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: ApiError) => console.error("Update lead status failed:", err.message),
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Lead>(`/leads/${id}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: ApiError) => console.error("Convert lead failed:", err.message),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: ApiError) => console.error("Delete lead failed:", err.message),
  });
}
