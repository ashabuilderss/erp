"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface EodReport {
  id: string;
  employeeId: string;
  employee?: { employeeCode: string };
  reportDate: string;
  accomplishments: string;
  challenges?: string;
  tomorrowPlan?: string;
  photoUrls?: string[];
  status: string;
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEodReportDto {
  reportDate: string;
  accomplishments: string;
  challenges?: string;
  tomorrowPlan?: string;
  photoUrls?: string[];
}

export interface UpdateEodReportDto {
  accomplishments?: string;
  challenges?: string;
  tomorrowPlan?: string;
  status?: string;
}

export function useEodReports(isMgmt: boolean) {
  return useQuery({
    queryKey: ["eod-reports", isMgmt ? "all" : "my"],
    queryFn: () =>
      api.get<EodReport[]>(isMgmt ? "/eod-reports" : "/eod-reports/my"),
  });
}

export function useEodReport(id: string) {
  return useQuery({
    queryKey: ["eod-reports", id],
    queryFn: () => api.get<EodReport>(`/eod-reports/${id}`),
    enabled: !!id,
  });
}

export function useCreateEodReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEodReportDto) =>
      api.post<EodReport>("/eod-reports", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eod-reports"] });
    },
  });
}

export function useSubmitEodReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<EodReport>(`/eod-reports/${id}`, { status: "SUBMITTED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eod-reports"] });
    },
  });
}

export function useReviewEodReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<EodReport>(`/eod-reports/${id}/review`, {
        status: "REVIEWED",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eod-reports"] });
    },
  });
}
