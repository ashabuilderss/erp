"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Meeting, MeetingAttendee, MeetingMinutes, MeetingActionItem, CreateMeetingDto, CreateMeetingMinutesDto, CreateActionItemDto, PaginatedResponse } from "@/lib/types";

export function useMeetings(query: { page?: number; limit?: number; status?: string } = {}) {
  return useQuery({
    queryKey: ["meetings", query],
    queryFn: () => api.get<PaginatedResponse<Meeting>>("/meetings", query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ["meeting", id],
    queryFn: () => api.get<Meeting>(`/meetings/${id}`),
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMeetingDto) => api.post<Meeting>("/meetings", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch<Meeting>(`/meetings/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/meetings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useCompleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Meeting>(`/meetings/${id}/complete`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useCancelMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Meeting>(`/meetings/${id}/cancel`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useAddMeetingAttendee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, dto }: { meetingId: string; dto: { employeeId: string } }) =>
      api.post<MeetingAttendee>(`/meetings/${meetingId}/attendees`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useAddMeetingMinutes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, dto }: { meetingId: string; dto: CreateMeetingMinutesDto }) =>
      api.post<MeetingMinutes>(`/meetings/${meetingId}/minutes`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useAddMeetingActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, dto }: { meetingId: string; dto: CreateActionItemDto }) =>
      api.post<MeetingActionItem>(`/meetings/${meetingId}/action-items`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useUpdateMeetingActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      api.patch<MeetingActionItem>(`/meetings/action-items/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}
