"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ReplayEventResponse, ReplayHandlerResponse } from "@/lib/types";

export function useReplayEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ReplayEventResponse>(`/internal/events/${id}/replay`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.security.events,
      });
    },
    onError: (err: ApiError) =>
      console.error("Replay event failed:", err.message),
  });
}

export function useReplayHandler() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      handlerName,
    }: {
      eventId: string;
      handlerName: string;
    }) =>
      api.post<ReplayHandlerResponse>(
        `/internal/events/handlers/${eventId}/${handlerName}/replay`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.security.events,
      });
    },
    onError: (err: ApiError) =>
      console.error("Replay handler failed:", err.message),
  });
}
