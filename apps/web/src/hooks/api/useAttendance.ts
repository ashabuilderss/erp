"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  Attendance,
  CheckInResponse,
  CheckOutResponse,
  CreateAttendanceDto,
  PaginatedResponse,
  QueryAttendanceDto,
  UpdateAttendanceDto,
} from "@/lib/types";

export function useAttendance(query: QueryAttendanceDto = {}) {
  return useQuery({
    queryKey: ["attendance", query],
    queryFn: () => api.get<PaginatedResponse<Attendance>>("/attendance", query),
    refetchInterval: 30_000,
  });
}

export function useTodayAttendance() {
  return useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => api.get<{ present: number; absent: number; onLeave: number; total: number; late: number }>("/attendance/today"),
    refetchInterval: 15_000,
  });
}

export function useAttendanceRecord(id: string) {
  return useQuery({
    queryKey: ["attendance", id],
    queryFn: () => api.get<Attendance>(`/attendance/${id}`),
    enabled: !!id,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAttendanceDto) => api.post<Attendance>("/attendance", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
    onError: (err: ApiError) => console.error("Create attendance failed:", err.message),
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAttendanceDto }) =>
      api.patch<Attendance>(`/attendance/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
    onError: (err: ApiError) => console.error("Update attendance failed:", err.message),
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/attendance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
    onError: (err: ApiError) => console.error("Delete attendance failed:", err.message),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<CheckInResponse>("/attendance/me/check-in"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err: ApiError) => console.error("Check-in failed:", err.message),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<CheckOutResponse>("/attendance/me/check-out"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err: ApiError) => console.error("Check-out failed:", err.message),
  });
}

export function useMyAttendance() {
  return useQuery({
    queryKey: ["attendance", "me"],
    queryFn: () => api.get<Attendance[]>("/attendance/me"),
    refetchInterval: 30_000,
  });
}

export function useVerifyAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/attendance/${id}/verify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
    onError: (err: ApiError) => console.error("Verify attendance failed:", err.message),
  });
}
