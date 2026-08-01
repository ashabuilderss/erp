"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PaymentEntry {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  reference?: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentSchedule {
  id: string;
  bookingId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: string;
}

export interface CreatePaymentEntryDto {
  amount: number;
  method: string;
  reference?: string;
  paymentDate: string;
  notes?: string;
}

export interface CreatePaymentScheduleDto {
  installmentNumber: number;
  amount: number;
  dueDate: string;
}

export function usePaymentEntries(bookingId: string | null) {
  return useQuery({
    queryKey: ["payment-entries", bookingId],
    queryFn: () =>
      api.get<PaymentEntry[]>(`/payment-entries/booking/${bookingId}`),
    enabled: !!bookingId,
  });
}

export function usePaymentSchedules(bookingId: string | null) {
  return useQuery({
    queryKey: ["payment-schedules", bookingId],
    queryFn: () =>
      api.get<PaymentSchedule[]>(`/payment-schedules/booking/${bookingId}`),
    enabled: !!bookingId,
  });
}

export function useCreatePaymentEntry(bookingId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePaymentEntryDto) =>
      api.post<PaymentEntry>(`/payment-entries/booking/${bookingId}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-entries"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCreatePaymentSchedule(bookingId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePaymentScheduleDto) =>
      api.post<PaymentSchedule>(
        `/payment-schedules/booking/${bookingId}`,
        dto
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-schedules"] });
    },
  });
}
