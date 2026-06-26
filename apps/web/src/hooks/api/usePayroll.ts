"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { PayrollRun, Payslip, CreatePayrollRunDto, QueryPayrollRunDto } from "@/lib/types";

export function usePayrollRuns(query: QueryPayrollRunDto = {}) {
  return useQuery({
    queryKey: ["payroll-runs", query],
    queryFn: () => api.get<{ data: PayrollRun[]; meta: any }>("/payroll-runs", query),
  });
}

export function usePayrollRun(id: string) {
  return useQuery({
    queryKey: ["payroll-runs", id],
    queryFn: () => api.get<PayrollRun>(`/payroll-runs/${id}`),
    enabled: !!id,
  });
}

export function useCreatePayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePayrollRunDto) => api.post<PayrollRun>("/payroll-runs", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
    },
    onError: (err: ApiError) => console.error("Create payroll run failed:", err.message),
  });
}

export function useProcessPayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<PayrollRun>(`/payroll-runs/${id}/process`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
    },
    onError: (err: ApiError) => console.error("Process payroll run failed:", err.message),
  });
}

export function usePayPayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<PayrollRun>(`/payroll-runs/${id}/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
    },
    onError: (err: ApiError) => console.error("Pay payroll run failed:", err.message),
  });
}

export function useCancelPayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<PayrollRun>(`/payroll-runs/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
    },
    onError: (err: ApiError) => console.error("Cancel payroll run failed:", err.message),
  });
}

export function useMyPayslips() {
  return useQuery({
    queryKey: ["payslips", "me"],
    queryFn: () => api.get<Payslip[]>("/payslips/me"),
  });
}
