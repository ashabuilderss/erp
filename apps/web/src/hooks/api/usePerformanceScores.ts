"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  PerformanceScore,
  PerformanceTrendSnapshot,
  LeaderboardEntry,
  QueryPerformanceScoresDto,
  CalculateScoreDto,
  RateEmployeeDto,
  GetTrendsDto,
  GetLeaderboardDto,
  PaginatedResponse,
} from "@/lib/types";

export function usePerformanceScores(query: QueryPerformanceScoresDto = {}) {
  return useQuery({
    queryKey: queryKeys.performanceScores.list(query),
    queryFn: () =>
      api.get<PaginatedResponse<PerformanceScore>>(
        "/performance-scores",
        query,
      ),
  });
}

export function usePerformanceScore(id: string) {
  return useQuery({
    queryKey: queryKeys.performanceScores.detail(id),
    queryFn: () => api.get<PerformanceScore>(`/performance-scores/${id}`),
    enabled: !!id,
  });
}

export function usePerformanceTrends(params: GetTrendsDto = {}) {
  return useQuery({
    queryKey: queryKeys.performanceScores.trends(params),
    queryFn: () =>
      api.get<PerformanceTrendSnapshot[]>("/performance-scores/trends", params),
  });
}

export function usePerformanceLeaderboard(params: GetLeaderboardDto) {
  return useQuery({
    queryKey: queryKeys.performanceScores.leaderboard(params),
    queryFn: () =>
      api.get<LeaderboardEntry[]>(
        "/performance-scores/leaderboard",
        params,
      ),
    enabled: !!params.period && !!params.periodType,
  });
}

export function useCalculateScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CalculateScoreDto) =>
      api.post<PerformanceScore>("/performance-scores/calculate", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.performanceScores.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Calculate score failed:", err.message),
  });
}

export function useRateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RateEmployeeDto) =>
      api.post<{ id: string }>("/performance-scores/rate", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.performanceScores.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Rate employee failed:", err.message),
  });
}

export function useRecalculateScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CalculateScoreDto) =>
      api.post<PerformanceScore>("/performance-scores/recalculate", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.performanceScores.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Recalculate score failed:", err.message),
  });
}
