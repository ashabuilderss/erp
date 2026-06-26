"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  ConstructionSite, SitePhase, Vendor, Material, MaterialInward,
  InventoryItem, LabourEntry, ProgressPhoto,
  CreateSiteDto, CreateVendorDto, CreateMaterialDto, CreateMaterialInwardDto,
  CreateLabourEntryDto, CreateProgressPhotoDto,
} from "@/lib/types";

export function useSites(query = {}) {
  return useQuery({ queryKey: ["construction-sites", query], queryFn: () => api.get<{ data: ConstructionSite[]; meta: any }>("/construction-sites", query) });
}

export function useSite(id: string) {
  return useQuery({ queryKey: ["construction-sites", id], queryFn: () => api.get<ConstructionSite>(`/construction-sites/${id}`), enabled: !!id });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: CreateSiteDto) => api.post("/construction-sites", dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["construction-sites"] }) });
}

export function useUpdateSite() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateSiteDto> }) => api.patch(`/construction-sites/${id}`, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["construction-sites"] }) });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/construction-sites/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["construction-sites"] }) });
}

export function useCreatePhase() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ siteId, dto }: { siteId: string; dto: any }) => api.post(`/construction-sites/${siteId}/phases`, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["construction-sites"] }) });
}

export function useUpdatePhase() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, dto }: { id: string; dto: any }) => api.patch(`/phases/${id}`, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["construction-sites"] }) });
}

export function useDeletePhase() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/phases/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["construction-sites"] }) });
}

export function useVendors(query = {}) {
  return useQuery({ queryKey: ["vendors", query], queryFn: () => api.get<{ data: Vendor[]; meta: any }>("/vendors", query) });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: CreateVendorDto) => api.post("/vendors", dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }) });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateVendorDto> }) => api.patch(`/vendors/${id}`, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }) });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/vendors/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }) });
}

export function useMaterials(query = {}) {
  return useQuery({ queryKey: ["materials", query], queryFn: () => api.get<{ data: Material[]; meta: any }>("/materials", query) });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: CreateMaterialDto) => api.post("/materials", dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }) });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateMaterialDto> }) => api.patch(`/materials/${id}`, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }) });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/materials/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }) });
}

export function useMaterialInward(query = {}) {
  return useQuery({ queryKey: ["material-inward", query], queryFn: () => api.get<{ data: MaterialInward[]; meta: any }>("/material-inward", query) });
}

export function useCreateMaterialInward() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: CreateMaterialInwardDto) => api.post("/material-inward", dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ["material-inward"] }); qc.invalidateQueries({ queryKey: ["inventory"] }); } });
}

export function useInventory(query = {}) {
  return useQuery({ queryKey: ["inventory", query], queryFn: () => api.get<InventoryItem[]>("/inventory", query) });
}

export function useLabourEntries(query = {}) {
  return useQuery({ queryKey: ["labour-entries", query], queryFn: () => api.get<{ data: LabourEntry[]; meta: any }>("/labour-entries", query) });
}

export function useCreateLabourEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: CreateLabourEntryDto) => api.post("/labour-entries", dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["labour-entries"] }) });
}

export function useDeleteLabourEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/labour-entries/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["labour-entries"] }) });
}

export function useSitePhotos(siteId: string) {
  return useQuery({ queryKey: ["progress-photos", siteId], queryFn: () => api.get<ProgressPhoto[]>(`/construction-sites/${siteId}/photos`), enabled: !!siteId });
}

export function useCreateProgressPhoto() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: CreateProgressPhotoDto) => api.post("/progress-photos", dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["progress-photos"] }) });
}

export function useDeleteProgressPhoto() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/progress-photos/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["progress-photos"] }) });
}
