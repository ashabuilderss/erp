"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { AttendanceCorrection, CreateAttendanceCorrectionDto, QueryAttendanceCorrectionDto } from "@/lib/types";

export function useAttendanceCorrections(query: QueryAttendanceCorrectionDto = {}) {
  return useQuery({
    queryKey: ["attendance-corrections", query],
    queryFn: () => api.get<{ data: AttendanceCorrection[]; meta: any }>("/attendance-corrections", query),
  });
}

export function useMyAttendanceCorrections() {
  return useQuery({
    queryKey: ["attendance-corrections", "me"],
    queryFn: () => api.get<AttendanceCorrection[]>("/attendance-corrections/me"),
  });
}

export function useCreateAttendanceCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAttendanceCorrectionDto) => api.post<AttendanceCorrection>("/attendance-corrections", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-corrections"] });
    },
    onError: (err: ApiError) => console.error("Create correction failed:", err.message),
  });
}

export function useApproveCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.post(`/attendance-corrections/${id}/approve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-corrections"] });
    },
    onError: (err: ApiError) => console.error("Approve correction failed:", err.message),
  });
}

export function useRejectCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.post(`/attendance-corrections/${id}/reject`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-corrections"] });
    },
    onError: (err: ApiError) => console.error("Reject correction failed:", err.message),
  });
}
