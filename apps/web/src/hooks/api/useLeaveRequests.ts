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
    onError: (err: ApiError) => console.error("Create leave request failed:", err.message),
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLeaveRequestDto }) =>
      api.patch<LeaveRequest>(`/leave-requests/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (err: ApiError) => console.error("Update leave request failed:", err.message),
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ApproveLeaveRequestDto }) =>
      api.patch<LeaveRequest>(`/leave-requests/${id}/approve`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-requests", "pending-count"] });
    },
    onError: (err: ApiError) => console.error("Approve leave request failed:", err.message),
  });
}

export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/leave-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-requests", "pending-count"] });
    },
    onError: (err: ApiError) => console.error("Delete leave request failed:", err.message),
  });
}
