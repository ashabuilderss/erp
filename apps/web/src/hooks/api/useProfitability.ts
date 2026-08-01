"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProjectBudget, ProjectCostEntry, CreateProjectBudgetDto, CreateCostEntryDto, PaginatedResponse, ProfitabilitySummary } from "@/lib/types";

export function useProjectBudgets(query: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["project-budgets", query],
    queryFn: () => api.get<PaginatedResponse<ProjectBudget>>("/project-profitability", query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectBudget(id: string) {
  return useQuery({
    queryKey: ["project-budget", id],
    queryFn: () => api.get<ProjectBudget>(`/project-profitability/${id}`),
    enabled: !!id,
  });
}

export function useProfitabilitySummary() {
  return useQuery({
    queryKey: ["profitability-summary"],
    queryFn: () => api.get<ProfitabilitySummary>("/project-profitability/summary"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProjectBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProjectBudgetDto) => api.post<ProjectBudget>("/project-profitability", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-budgets"] }),
  });
}

export function useUpdateProjectBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch<ProjectBudget>(`/project-profitability/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-budgets"] }),
  });
}

export function useAddCostEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, dto }: { budgetId: string; dto: CreateCostEntryDto }) =>
      api.post<ProjectCostEntry>(`/project-profitability/${budgetId}/entries`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-budgets"] }),
  });
}

export function useDeleteCostEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => api.delete(`/project-profitability/entries/${entryId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-budgets"] }),
  });
}
