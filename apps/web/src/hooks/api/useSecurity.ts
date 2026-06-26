"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useLoginHistory() {
  return useQuery({
    queryKey: ["login-history"],
    queryFn: () => api.get<{ data: Array<{ id: string; email: string; status: string; reason: string | null; createdAt: string }>; meta: { total: number } }>("/login-history"),
  });
}

export function useSecurityEvents() {
  return useQuery({
    queryKey: ["security-events"],
    queryFn: () => api.get<{ data: Array<{ id: string; type: string; severity: string; description: string | null; createdAt: string }>; meta: { total: number } }>("/security-events"),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.get<Array<{ id: string; createdAt: string }>>("/sessions"),
  });
}

export function useFilePolicy() {
  return useQuery({
    queryKey: ["file-policy"],
    queryFn: () => api.get<{ maxSizeBytes: number; allowedExtensions: string[] }>("/uploads/policy"),
  });
}
