"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Property, PropertyQuery, CreatePropertyDto, PaginatedResponse, UpdatePropertyDto } from "@/lib/types";

export function useProperties(query: PropertyQuery = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["properties", query],
    queryFn: () => api.get<PaginatedResponse<Property>>("/properties", query),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["property", id],
    queryFn: () => api.get<Property>(`/properties/${id}`),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePropertyDto) => api.post<Property>("/properties", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (err: ApiError) => {
      console.error("Create property failed:", err.message);
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePropertyDto }) =>
      api.patch<Property>(`/properties/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (err: ApiError) => {
      console.error("Update property failed:", err.message);
    },
  });
}

export function useUpdatePropertyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<Property>(`/properties/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (err: ApiError) => {
      console.error("Update property status failed:", err.message);
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (err: ApiError) => {
      console.error("Delete property failed:", err.message);
    },
  });
}
