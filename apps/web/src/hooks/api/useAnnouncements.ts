"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  Announcement,
  AnnouncementReceiptsResponse,
  QueryAnnouncementsDto,
  CreateAnnouncementDto,
  PaginatedResponse,
} from "@/lib/types";

export function useAnnouncements(query: QueryAnnouncementsDto = {}) {
  return useQuery({
    queryKey: queryKeys.announcements.list(query),
    queryFn: () =>
      api.get<PaginatedResponse<Announcement>>("/announcements", query),
  });
}

export function useMyAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.my,
    queryFn: () => api.get<Announcement[]>("/announcements/my"),
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(id),
    queryFn: () => api.get<Announcement>(`/announcements/${id}`),
    enabled: !!id,
  });
}

export function useAnnouncementReceipts(id: string) {
  return useQuery({
    queryKey: queryKeys.announcements.receipts(id),
    queryFn: () =>
      api.get<AnnouncementReceiptsResponse>(`/announcements/${id}/receipts`),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAnnouncementDto) =>
      api.post<Announcement>("/announcements", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Create announcement failed:", err.message),
  });
}

export function usePublishAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: string) =>
      api.post<{ success: boolean }>("/announcements/publish", {
        announcementId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Publish announcement failed:", err.message),
  });
}

export function useArchiveAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: string) =>
      api.post<{ success: boolean }>("/announcements/archive", {
        announcementId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.all,
      });
    },
    onError: (err: ApiError) =>
      console.error("Archive announcement failed:", err.message),
  });
}

export function useReadAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ success: boolean }>(`/announcements/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.my,
      });
    },
    onError: (err: ApiError) =>
      console.error("Read announcement failed:", err.message),
  });
}

export function useAcknowledgeAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ success: boolean }>(`/announcements/${id}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.my,
      });
    },
    onError: (err: ApiError) =>
      console.error("Acknowledge announcement failed:", err.message),
  });
}
