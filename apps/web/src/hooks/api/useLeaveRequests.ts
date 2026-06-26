"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  ApproveLeaveRequestDto,
  CreateLeaveRequestDto,
  LeaveRequest,
  PaginatedResponse,
  QueryLeaveRequestDto,
  UpdateLeaveRequestDto,
} from "@/lib/types";

export function useLeaveRequests(query: QueryLeaveRequestDto = {}) {
  return useQuery({
    queryKey: ["leave-requests", query],
    queryFn: () => api.get<PaginatedResponse<LeaveRequest>>("/leave-requests", query),
  });
}

export function usePendingLeaveCount() {
  return useQuery({
    queryKey: ["leave-requests", "pending-count"],
    queryFn: () => api.get<number>("/leave-requests/pending-count"),
  });
}

export function useLeaveRequest(id: string) {
  return useQuery({
    queryKey: ["leave-request", id],
    queryFn: () => api.get<LeaveRequest>(`/leave-requests/${id}`),
    enabled: !!id,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeaveRequestDto) => api.post<LeaveRequest>("/leave-requests", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-requests", "pending-count"] });
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLeaveRequestDto }) =>
      api.patch<LeaveRequest>(`/leave-requests/${id}`, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: ["leave-requests"] });
      const snapshots: { key: readonly unknown[]; data: unknown }[] = [];
      queryClient.getQueriesData({ queryKey: ["leave-requests"] }).forEach(([key, prev]) => {
        if (prev && typeof prev === "object" && "data" in (prev as any)) {
          snapshots.push({ key, data: JSON.parse(JSON.stringify(prev)) });
          const p = prev as { data: any[]; meta: any };
          queryClient.setQueryData(key, { ...p, data: p.data.map((item: any) => item.id === id ? { ...item, ...dto } : item) });
        }
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => { ctx?.snapshots?.forEach((s) => queryClient.setQueryData(s.key, s.data)); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["leave-requests"] }); },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ApproveLeaveRequestDto }) =>
      api.patch<LeaveRequest>(`/leave-requests/${id}/approve`, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-requests", "pending-count"] });
    },
  });
}

export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/leave-requests/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["leave-requests"] });
      const snapshots: { key: readonly unknown[]; data: unknown }[] = [];
      queryClient.getQueriesData({ queryKey: ["leave-requests"] }).forEach(([key, prev]) => {
        if (prev && typeof prev === "object" && "data" in (prev as any)) {
          snapshots.push({ key, data: JSON.parse(JSON.stringify(prev)) });
          const p = prev as { data: any[]; meta: any };
          queryClient.setQueryData(key, { ...p, data: p.data.filter((item: any) => item.id !== id) });
        }
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => { ctx?.snapshots?.forEach((s) => queryClient.setQueryData(s.key, s.data)); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-requests", "pending-count"] });
    },
  });
}
