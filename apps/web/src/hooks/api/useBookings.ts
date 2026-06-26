"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Booking, BookingQuery, CreateBookingDto, PaginatedResponse, UpdateBookingDto } from "@/lib/types";

export function useBookings(query: BookingQuery = {}) {
  return useQuery({
    queryKey: ["bookings", query],
    queryFn: () => api.get<PaginatedResponse<Booking>>("/bookings", query),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.get<Booking>(`/bookings/${id}`),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBookingDto) => api.post<Booking>("/bookings", dto),
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      const snapshots: { key: readonly unknown[]; data: unknown }[] = [];
      queryClient.getQueriesData({ queryKey: ["bookings"] }).forEach(([key, prev]) => {
        if (prev && typeof prev === "object" && "data" in (prev as any)) {
          snapshots.push({ key, data: JSON.parse(JSON.stringify(prev)) });
          const p = prev as { data: any[]; meta: any };
          queryClient.setQueryData(key, { ...p, data: [...p.data, { ...dto, id: "temp-" + Date.now() }] });
        }
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => { ctx?.snapshots?.forEach((s) => queryClient.setQueryData(s.key, s.data)); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBookingDto }) =>
      api.patch<Booking>(`/bookings/${id}`, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      const snapshots: { key: readonly unknown[]; data: unknown }[] = [];
      queryClient.getQueriesData({ queryKey: ["bookings"] }).forEach(([key, prev]) => {
        if (prev && typeof prev === "object" && "data" in (prev as any)) {
          snapshots.push({ key, data: JSON.parse(JSON.stringify(prev)) });
          const p = prev as { data: any[]; meta: any };
          queryClient.setQueryData(key, { ...p, data: p.data.map((item: any) => item.id === id ? { ...item, ...dto } : item) });
        }
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => { ctx?.snapshots?.forEach((s) => queryClient.setQueryData(s.key, s.data)); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<Booking>(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: ApiError) => console.error("Update booking status failed:", err.message),
  });
}

export function useUpdateBookingPaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) =>
      api.patch<Booking>(`/bookings/${id}/payment-status`, { paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: ApiError) => console.error("Update booking payment status failed:", err.message),
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bookings/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      const snapshots: { key: readonly unknown[]; data: unknown }[] = [];
      queryClient.getQueriesData({ queryKey: ["bookings"] }).forEach(([key, prev]) => {
        if (prev && typeof prev === "object" && "data" in (prev as any)) {
          snapshots.push({ key, data: JSON.parse(JSON.stringify(prev)) });
          const p = prev as { data: any[]; meta: any };
          queryClient.setQueryData(key, { ...p, data: p.data.filter((item: any) => item.id !== id) });
        }
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => { ctx?.snapshots?.forEach((s) => queryClient.setQueryData(s.key, s.data)); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); },
  });
}
