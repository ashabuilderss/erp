"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface EscalationRule {
  id: string;
  name: string;
  triggerType: string;
  config: Record<string, unknown>;
  level: number;
  notifyRoles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EscalationEvent {
  id: string;
  ruleId: string;
  rule?: { name: string; triggerType: string; level: number };
  entityType: string;
  entityId: string;
  status: string;
  triggeredAt: string;
  resolvedAt?: string;
}

export interface CreateEscalationRuleDto {
  name: string;
  triggerType: string;
  config: Record<string, unknown>;
  level: number;
  notifyRoles: string[];
  isActive?: boolean;
}

export function useEscalationRules() {
  return useQuery({
    queryKey: ["escalation-rules"],
    queryFn: () => api.get<EscalationRule[]>("/escalation-rules"),
  });
}

export function useEscalationEvents() {
  return useQuery({
    queryKey: ["escalation-events"],
    queryFn: () => api.get<EscalationEvent[]>("/escalation-events"),
  });
}

export function useCreateEscalationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEscalationRuleDto) =>
      api.post<EscalationRule>("/escalation-rules", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escalation-rules"] });
    },
  });
}

export function useDeleteEscalationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/escalation-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escalation-rules"] });
    },
  });
}

export function useResolveEscalationEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/escalation-events/${id}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escalation-events"] });
    },
  });
}
