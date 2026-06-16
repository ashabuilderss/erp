"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Performance, QueryPerformanceDto, CreatePerformanceDto, PaginatedResponse, UpdatePerformanceDto } from "@/lib/types";

export function usePerformance(query: QueryPerformanceDto = {}) {
  return useQuery({
    queryKey: ["performance", query],
    queryFn: () => api.get<PaginatedResponse<Performance>>("/performance", query),
  });
}

export function useAveragePerformance(year?: number, quarter?: number) {
  return useQuery({
    queryKey: ["performance", "average", year, quarter],
    queryFn: () => api.get<{ averageScore: number }>("/performance/average", { year, quarter }),
  });
}

export function useEmployeePerformance(employeeId: string, year?: number) {
  return useQuery({
    queryKey: ["performance", "employee", employeeId, year],
    queryFn: () => api.get<Performance[]>(`/performance/employee/${employeeId}`, { year }),
    enabled: !!employeeId,
  });
}

export function usePerformanceRecord(id: string) {
  return useQuery({
    queryKey: ["performance", id],
    queryFn: () => api.get<Performance>(`/performance/${id}`),
    enabled: !!id,
  });
}

export function useCreatePerformance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePerformanceDto) => api.post<Performance>("/performance", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance"] });
      queryClient.invalidateQueries({ queryKey: ["performance", "average"] });
    },
    onError: (err: ApiError) => console.error("Create performance failed:", err.message),
  });
}

export function useUpdatePerformance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePerformanceDto }) =>
      api.patch<Performance>(`/performance/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance"] });
      queryClient.invalidateQueries({ queryKey: ["performance", "average"] });
    },
    onError: (err: ApiError) => console.error("Update performance failed:", err.message),
  });
}

export function useDeletePerformance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/performance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance"] });
      queryClient.invalidateQueries({ queryKey: ["performance", "average"] });
    },
    onError: (err: ApiError) => console.error("Delete performance failed:", err.message),
  });
}
