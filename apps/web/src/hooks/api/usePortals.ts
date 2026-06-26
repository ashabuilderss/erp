"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Broker, Complaint, CreateBrokerDto, CreateComplaintDto } from "@/lib/types";

export function useBrokers(query = {}) {
  return useQuery({ queryKey: ["brokers", query], queryFn: () => api.get<{ data: Broker[]; meta: any }>("/brokers", query) });
}

export function useCreateBroker() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: CreateBrokerDto) => api.post("/brokers", dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["brokers"] }) });
}

export function useUpdateBroker() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateBrokerDto> }) => api.patch(`/brokers/${id}`, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["brokers"] }) });
}

export function useDeleteBroker() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/brokers/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["brokers"] }) });
}

export function useComplaints(query = {}) {
  return useQuery({ queryKey: ["complaints", query], queryFn: () => api.get<{ data: Complaint[]; meta: any }>("/complaints", query) });
}

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: CreateComplaintDto) => api.post("/complaints", dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["complaints"] }) });
}

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, dto }: { id: string; dto: any }) => api.patch(`/complaints/${id}`, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["complaints"] }) });
}

export function useDeleteComplaint() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/complaints/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["complaints"] }) });
}

export function useResolveComplaint() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, resolution }: { id: string; resolution: string }) => api.post(`/complaints/${id}/resolve`, { resolution }), onSuccess: () => qc.invalidateQueries({ queryKey: ["complaints"] }) });
}
