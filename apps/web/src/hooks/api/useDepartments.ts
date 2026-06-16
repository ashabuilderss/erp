"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Department, QueryDepartmentDto, CreateDepartmentDto, PaginatedResponse, UpdateDepartmentDto } from "@/lib/types";

export function useDepartments(query: QueryDepartmentDto = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["departments", query],
    queryFn: () => api.get<PaginatedResponse<Department>>("/departments", query),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: ["department", id],
    queryFn: () => api.get<Department>(`/departments/${id}`),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDepartmentDto) => api.post<Department>("/departments", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: ApiError) => console.error("Create department failed:", err.message),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDepartmentDto }) =>
      api.patch<Department>(`/departments/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: ApiError) => console.error("Update department failed:", err.message),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: ApiError) => console.error("Delete department failed:", err.message),
  });
}
