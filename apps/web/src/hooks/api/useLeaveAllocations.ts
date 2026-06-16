"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  LeaveAllocation,
  LeaveAllocationBalance,
  PaginatedResponse,
  QueryLeaveAllocationDto,
  CreateLeaveAllocationDto,
  UpdateLeaveAllocationDto,
} from "@/lib/types";

export function useLeaveAllocations(query: QueryLeaveAllocationDto = {}) {
  return useQuery({
    queryKey: ["leave-allocations", query],
    queryFn: () => api.get<PaginatedResponse<LeaveAllocation>>("/leave-allocations", query),
  });
}

export function useMyLeaveBalance() {
  return useQuery({
    queryKey: ["leave-allocations", "my-balance"],
    queryFn: () => api.get<LeaveAllocationBalance[]>("/leave-allocations/my-balance"),
  });
}

export function useEmployeeLeaveBalance(employeeId: string) {
  return useQuery({
    queryKey: ["leave-allocations", "balance", employeeId],
    queryFn: () => api.get<LeaveAllocationBalance[]>(`/leave-allocations/employee/${employeeId}`),
    enabled: !!employeeId,
  });
}

export function useLeaveAllocation(id: string) {
  return useQuery({
    queryKey: ["leave-allocation", id],
    queryFn: () => api.get<LeaveAllocation>(`/leave-allocations/${id}`),
    enabled: !!id,
  });
}

export function useCreateLeaveAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeaveAllocationDto) => api.post<LeaveAllocation>("/leave-allocations", dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-allocations"] });
    },
    onError: (err: ApiError) => console.error("Create leave allocation failed:", err.message),
  });
}

export function useUpdateLeaveAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLeaveAllocationDto }) =>
      api.patch<LeaveAllocation>(`/leave-allocations/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-allocations"] });
    },
    onError: (err: ApiError) => console.error("Update leave allocation failed:", err.message),
  });
}

export function useDeleteLeaveAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/leave-allocations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-allocations"] });
    },
    onError: (err: ApiError) => console.error("Delete leave allocation failed:", err.message),
  });
}
