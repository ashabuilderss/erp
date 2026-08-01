"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JobPosting, Candidate, Interview, CreateJobPostingDto, CreateCandidateDto, CreateInterviewDto, PaginatedResponse } from "@/lib/types";

export function useJobPostings(query: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["job-postings", query],
    queryFn: () => api.get<PaginatedResponse<JobPosting>>("/recruitment/jobs", query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useJobPosting(id: string) {
  return useQuery({
    queryKey: ["job-posting", id],
    queryFn: () => api.get<JobPosting>(`/recruitment/jobs/${id}`),
    enabled: !!id,
  });
}

export function useCandidates(query: { page?: number; limit?: number; jobPostingId?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["candidates", query],
    queryFn: () => api.get<PaginatedResponse<Candidate>>("/recruitment/candidates", query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ["candidate", id],
    queryFn: () => api.get<Candidate>(`/recruitment/candidates/${id}`),
    enabled: !!id,
  });
}

export function useCreateJobPosting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateJobPostingDto) => api.post<JobPosting>("/recruitment/jobs", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-postings"] }),
  });
}

export function useUpdateJobPosting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch<JobPosting>(`/recruitment/jobs/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-postings"] }),
  });
}

export function useDeleteJobPosting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/recruitment/jobs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-postings"] }),
  });
}

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCandidateDto) => api.post<Candidate>("/recruitment/candidates", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch<Candidate>(`/recruitment/candidates/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useScheduleInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, dto }: { candidateId: string; dto: CreateInterviewDto }) =>
      api.post<Interview>(`/recruitment/candidates/${candidateId}/interviews`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch<Interview>(`/recruitment/interviews/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });
}
