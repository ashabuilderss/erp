"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Asset, AssetAssignment, AssetRepair, CreateAssetDto, CreateAssetAssignmentDto, CreateAssetRepairDto, PaginatedResponse, AssetSummary } from "@/lib/types";

export function useAssets(query: { page?: number; limit?: number; status?: string; category?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["assets", query],
    queryFn: () => api.get<PaginatedResponse<Asset>>("/assets", query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ["asset", id],
    queryFn: () => api.get<Asset>(`/assets/${id}`),
    enabled: !!id,
  });
}

export function useAssetSummary() {
  return useQuery({
    queryKey: ["asset-summary"],
    queryFn: () => api.get<AssetSummary>("/assets/summary"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAssetDto) => api.post<Asset>("/assets", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch<Asset>(`/assets/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useAssignAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateAssetAssignmentDto }) =>
      api.post<AssetAssignment>(`/assets/${id}/assign`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useReturnAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { condition?: string } }) =>
      api.post<Asset>(`/assets/${id}/return`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useCreateAssetRepair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateAssetRepairDto }) =>
      api.post<AssetRepair>(`/assets/${id}/repairs`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useUpdateAssetRepair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch<AssetRepair>(`/assets/repairs/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}
