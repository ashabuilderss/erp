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
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: ["attendance"] });
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: Attendance = {
        id: tempId,
        employeeId: dto.employeeId,
        date: dto.date,
        checkIn: dto.checkIn ?? null,
        checkOut: dto.checkOut ?? null,
        status: dto.status ?? "PRESENT",
        companyId: "",
        verified: false,
        verifiedById: null,
        verifiedAt: null,
        latitude: null,
        longitude: null,
        checkInPhoto: null,
        checkOutPhoto: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const rollbacks: (() => void)[] = [];
      queryClient.getQueriesData<{ data: Attendance[]; meta: any }>({ queryKey: ["attendance"] }).forEach(([key, prev]) => {
        if (prev) {
          const prevCopy = JSON.parse(JSON.stringify(prev));
          rollbacks.push(() => queryClient.setQueryData(key, prevCopy));
          queryClient.setQueryData(key, { ...prev, data: [optimisticItem, ...prev.data] });
        }
      });
      return { rollbacks };
    },
    onError: (_err, _dto, context) => { context?.rollbacks?.forEach((r) => r()); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAttendanceDto }) =>
      api.patch<Attendance>(`/attendance/${id}`, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: ["attendance"] });
      const rollbacks: (() => void)[] = [];
      queryClient.getQueriesData<{ data: Attendance[]; meta: any }>({ queryKey: ["attendance"] }).forEach(([key, prev]) => {
        if (prev) {
          const prevCopy = JSON.parse(JSON.stringify(prev));
          rollbacks.push(() => queryClient.setQueryData(key, prevCopy));
          queryClient.setQueryData(key, { ...prev, data: prev.data.map((item: Attendance) => item.id === id ? { ...item, ...dto } : item) });
        }
      });
      return { rollbacks };
    },
    onError: (_err, _vars, context) => { context?.rollbacks?.forEach((r) => r()); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "me"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/attendance/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["attendance"] });
      const rollbacks: (() => void)[] = [];
      queryClient.getQueriesData<{ data: Attendance[]; meta: any }>({ queryKey: ["attendance"] }).forEach(([key, prev]) => {
        if (prev) {
          const prevCopy = JSON.parse(JSON.stringify(prev));
          rollbacks.push(() => queryClient.setQueryData(key, prevCopy));
          queryClient.setQueryData(key, { ...prev, data: prev.data.filter((item: Attendance) => item.id !== id) });
        }
      });
      return { rollbacks };
    },
    onError: (_err, _id, context) => { context?.rollbacks?.forEach((r) => r()); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body?: { latitude?: number; longitude?: number; checkInPhoto?: string }) => api.post<CheckInResponse>("/attendance/me/check-in", body ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "me"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err: ApiError) => console.error("Check-in failed:", err.message),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body?: { latitude?: number; longitude?: number; checkOutPhoto?: string }) => api.post<CheckOutResponse>("/attendance/me/check-out", body ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "me"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err: ApiError) => console.error("Check-out failed:", err.message),
  });
}

export function useMyAttendance() {
  return useQuery({
    queryKey: ["attendance", "me"],
    queryFn: () => api.get<{ today: string; records: Attendance[] }>("/attendance/me"),
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

export interface Last7DaysData {
  days: string[];
  employees: Array<{
    employee: { id: string; employeeCode: string; user: { firstName: string; lastName: string } };
    days: Record<string, string | null>;
  }>;
}

export function useLast7DaysAttendance() {
  return useQuery({
    queryKey: ["attendance", "last-7-days"],
    queryFn: () => api.get<Last7DaysData>("/attendance/last-7-days"),
    refetchInterval: 60_000,
  });
}
