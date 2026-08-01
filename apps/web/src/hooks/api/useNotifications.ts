"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";

export interface Notification {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useNotifications(page = 1, limit = 20, filters?: { acknowledged?: string }) {
  const searchParams = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.acknowledged) searchParams.set("acknowledged", filters.acknowledged);
  return useQuery({
    queryKey: ["notifications", page, limit, filters],
    queryFn: () =>
      api.get<PaginatedResponse<Notification>>(`/notifications?${searchParams}`),
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () =>
      api
        .get<{ count: number }>("/notifications/unread-count")
        .then((r) => r.count),
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUnacknowledgedCount() {
  return useQuery({
    queryKey: ["notifications", "unacknowledged-count"],
    queryFn: () =>
      api
        .get<{ count: number }>("/notifications/unacknowledged-count")
        .then((r) => r.count),
    refetchInterval: 30000,
  });
}

export function useAcknowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/acknowledge`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unacknowledged-count"] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useNotificationStream() {
  const { data: session, status } = useSession();
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      path: "/api/v1/socket.io",
      auth: { token: (session as any).accessToken },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("notification", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session, status, qc]);
}
