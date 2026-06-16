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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: ApiError) => console.error("Create booking failed:", err.message),
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBookingDto }) =>
      api.patch<Booking>(`/bookings/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: ApiError) => console.error("Update booking failed:", err.message),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: ApiError) => console.error("Delete booking failed:", err.message),
  });
}
