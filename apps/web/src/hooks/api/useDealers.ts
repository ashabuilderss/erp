"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Dealer, CreateDealerDto } from "@/lib/types";

export function useDealers(query = {}) {
  return useQuery({ queryKey: ["dealers", query], queryFn: () => api.get<{ data: Dealer[]; meta: any }>("/dealers", query) });
}

export function useCreateDealer() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: CreateDealerDto) => api.post("/dealers", dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["dealers"] }) });
}

export function useUpdateDealer() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateDealerDto> }) => api.patch(`/dealers/${id}`, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ["dealers"] }) });
}

export function useDeleteDealer() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/dealers/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["dealers"] }) });
}
