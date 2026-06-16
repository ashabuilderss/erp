"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { SiteVisit, SiteVisitQuery, CreateSiteVisitDto, PaginatedResponse, UpdateSiteVisitDto } from "@/lib/types";

export function useSiteVisits(query: SiteVisitQuery = {}) {
  return useQuery({
    queryKey: ["site-visits", query],
    queryFn: () => api.get<PaginatedResponse<SiteVisit>>("/site-visits", query),
  });
}

export function useSiteVisit(id: string) {
  return useQuery({
    queryKey: ["site-visit", id],
    queryFn: () => api.get<SiteVisit>(`/site-visits/${id}`),
    enabled: !!id,
  });
}

export function useCreateSiteVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSiteVisitDto) => api.post<SiteVisit>("/site-visits", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-visits"] });
    },
    onError: (err: ApiError) => console.error("Create site visit failed:", err.message),
  });
}

export function useUpdateSiteVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSiteVisitDto }) =>
      api.patch<SiteVisit>(`/site-visits/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-visits"] });
    },
    onError: (err: ApiError) => console.error("Update site visit failed:", err.message),
  });
}

export function useUpdateSiteVisitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<SiteVisit>(`/site-visits/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-visits"] });
    },
    onError: (err: ApiError) => console.error("Update site visit status failed:", err.message),
  });
}

export function useDeleteSiteVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/site-visits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-visits"] });
    },
    onError: (err: ApiError) => console.error("Delete site visit failed:", err.message),
  });
}
