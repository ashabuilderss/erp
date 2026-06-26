"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Incentive } from "@/lib/types";

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useIncentives() {
  return useQuery({
    queryKey: ["incentives"],
    queryFn: () => api.get<PaginatedResponse<Incentive>>("/incentives"),
    select: (res) => res?.data ?? [],
  });
}

export function useActiveIncentives() {
  return useQuery({
    queryKey: ["incentives", "active"],
    queryFn: () => api.get<PaginatedResponse<Incentive>>("/incentives/active"),
    select: (res) => res?.data ?? [],
  });
}

export function useCreateIncentive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { title: string; description: string; award: string; status: string; opportunityType: string; opportunityLabel?: string }) =>
      api.post("/incentives", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incentives"] }),
  });
}

export function useUpdateIncentive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch(`/incentives/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incentives"] });
    },
  });
}

export interface LeaderboardEntry {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  incentivesWon: number;
  incentivesValue: number;
  commissionsPaid: number;
  commissionTotal: number;
  incentivesScore: number;
  commissionScore: number;
  totalScore: number;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["incentives", "leaderboard"],
    queryFn: () => api.get<LeaderboardEntry[]>("/incentives/leaderboard"),
  });
}
