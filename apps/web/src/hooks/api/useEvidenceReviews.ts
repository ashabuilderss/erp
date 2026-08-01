"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  EvidenceReviewListResponse,
  EvidenceReviewStatus,
  EvidenceReviewView,
} from "@/lib/types";
import { useToast } from "@/components/ui/toast";

export interface EvidenceReviewParams {
  page?: number;
  limit?: number;
  status?: EvidenceReviewStatus;
}

export function useEvidenceReviews(params: EvidenceReviewParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  const endpoint = qs ? `/evidence-reviews?${qs}` : `/evidence-reviews/queue`;
  return useQuery({
    queryKey: ["evidence-reviews", params],
    queryFn: () => api.get<EvidenceReviewListResponse>(endpoint),
    refetchInterval: 30_000,
  });
}

export function useEvidenceReview(id: string) {
  return useQuery({
    queryKey: ["evidence-review", id],
    queryFn: () => api.get<EvidenceReviewView>(`/evidence-reviews/${id}/view`),
    enabled: !!id,
  });
}

export function useReviewEvidence() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: EvidenceReviewStatus; remarks?: string }) =>
      api.patch<{ id: string; status: EvidenceReviewStatus }>(
        `/evidence-reviews/${id}/review`,
        { status, remarks },
      ),
    onSuccess: (data) => {
      showToast(`Evidence ${data.status.toLowerCase()}`, "success");
      queryClient.invalidateQueries({ queryKey: ["evidence-reviews"] });
      queryClient.removeQueries({ queryKey: ["evidence-review"] });
    },
    onError: (err: ApiError) =>
      showToast(err.message || "Failed to review evidence", "error"),
  });
}
