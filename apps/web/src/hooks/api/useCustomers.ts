"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Customer, CustomerQuery, CreateCustomerDto, PaginatedResponse, UpdateCustomerDto } from "@/lib/types";

export function useCustomers(query: CustomerQuery = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["customers", query],
    queryFn: () => api.get<PaginatedResponse<Customer>>("/customers", query),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => api.get<Customer>(`/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCustomerDto) => api.post<Customer>("/customers", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: ApiError) => console.error("Create customer failed:", err.message),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerDto }) =>
      api.patch<Customer>(`/customers/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: ApiError) => console.error("Update customer failed:", err.message),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: ApiError) => console.error("Delete customer failed:", err.message),
  });
}
