"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Assignment, QueryAssignmentDto, CreateAssignmentDto, PaginatedResponse, UpdateAssignmentDto } from "@/lib/types";

export function useAssignments(query: QueryAssignmentDto = {}) {
  return useQuery({
    queryKey: ["assignments", query],
    queryFn: () => api.get<PaginatedResponse<Assignment>>("/assignments", query),
  });
}

export function useAssignmentsByEmployee(employeeId: string) {
  return useQuery({
    queryKey: ["assignments", "employee", employeeId],
    queryFn: () => api.get<Assignment[]>(`/assignments/employee/${employeeId}`),
    enabled: !!employeeId,
  });
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: ["assignment", id],
    queryFn: () => api.get<Assignment>(`/assignments/${id}`),
    enabled: !!id,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAssignmentDto) => api.post<Assignment>("/assignments", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err: ApiError) => console.error("Create assignment failed:", err.message),
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAssignmentDto }) =>
      api.patch<Assignment>(`/assignments/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err: ApiError) => console.error("Update assignment failed:", err.message),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err: ApiError) => console.error("Delete assignment failed:", err.message),
  });
}
