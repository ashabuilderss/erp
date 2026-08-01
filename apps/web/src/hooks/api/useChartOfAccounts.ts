"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ChartOfAccount {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  parentId?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: { id: string; code: string; name: string };
  children?: { id: string; code: string; name: string; type: string }[];
}

export interface CreateChartOfAccountDto {
  code: string;
  name: string;
  type: ChartOfAccount["type"];
  parentId?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateChartOfAccountDto extends Partial<CreateChartOfAccountDto> {}

export interface ChartOfAccountListResponse {
  items: ChartOfAccount[];
  total: number;
  page: number;
  limit: number;
}

export function useChartOfAccounts(params?: { page?: string; limit?: string; type?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page);
  if (params?.limit) searchParams.set("limit", params.limit);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["chart-of-accounts", params],
    queryFn: () =>
      api.get<ChartOfAccountListResponse>(`/chart-of-accounts${qs ? `?${qs}` : ""}`),
  });
}

export function useChartOfAccount(id: string | null) {
  return useQuery({
    queryKey: ["chart-of-accounts", id],
    queryFn: () => api.get<ChartOfAccount>(`/chart-of-accounts/${id}`),
    enabled: !!id,
  });
}

export function useCreateChartOfAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateChartOfAccountDto) =>
      api.post<ChartOfAccount>("/chart-of-accounts", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
    },
  });
}

export function useUpdateChartOfAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: UpdateChartOfAccountDto & { id: string }) =>
      api.patch<ChartOfAccount>(`/chart-of-accounts/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
    },
  });
}

export function useDeleteChartOfAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/chart-of-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
    },
  });
}
