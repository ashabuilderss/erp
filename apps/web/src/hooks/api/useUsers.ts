"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { PaginatedResponse, QueryParams, User } from "@/lib/types";

export function useUsers(query: QueryParams = {}) {
  return useQuery({
    queryKey: ["users", query],
    queryFn: () => api.get<PaginatedResponse<User>>("/users", query),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { role?: string; isActive?: boolean } }) =>
      api.patch<User>(`/users/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: ApiError) => console.error("Update user failed:", err.message),
  });
}
