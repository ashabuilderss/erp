"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  CreateEmployeeDto,
  Employee,
  PaginatedResponse,
  QueryEmployeeDto,
  UpdateEmployeeDto,
  UserRole,
} from "@/lib/types";

export interface CreateEmployeeWithUserDto extends CreateEmployeeDto {
  email: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  password?: string;
}

export function useEmployees(query: QueryEmployeeDto = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["employees", query],
    queryFn: () => api.get<PaginatedResponse<Employee>>("/employees", query),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => api.get<Employee>(`/employees/${id}`),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEmployeeDto) => api.post<Employee>("/employees", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: ApiError) => console.error("Create employee failed:", err.message),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEmployeeDto }) =>
      api.patch<Employee>(`/employees/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: ApiError) => console.error("Update employee failed:", err.message),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: ApiError) => console.error("Delete employee failed:", err.message),
  });
}

export function useInviteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      api.post(`/employees/${id}/invite`, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: ApiError) => console.error("Invite employee failed:", err.message),
  });
}

export function useCreateEmployeeWithUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEmployeeWithUserDto) =>
      api.post<Employee>("/auth/employees/with-user", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: ApiError) => console.error("Create employee with user failed:", err.message),
  });
}
