"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Designation, QueryDesignationDto, CreateDesignationDto, PaginatedResponse, UpdateDesignationDto } from "@/lib/types";

export function useDesignations(query: QueryDesignationDto = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["designations", query],
    queryFn: () => api.get<PaginatedResponse<Designation>>("/designations", query),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useDesignation(id: string) {
  return useQuery({
    queryKey: ["designation", id],
    queryFn: () => api.get<Designation>(`/designations/${id}`),
    enabled: !!id,
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDesignationDto) => api.post<Designation>("/designations", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: ApiError) => console.error("Create designation failed:", err.message),
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDesignationDto }) =>
      api.patch<Designation>(`/designations/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: ApiError) => console.error("Update designation failed:", err.message),
  });
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/designations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: ApiError) => console.error("Delete designation failed:", err.message),
  });
}
