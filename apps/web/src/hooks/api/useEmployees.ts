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

export interface CreateEmployeeWithUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  employeeCode?: string;
  departmentId: string;
  designationId: string;
  phone?: string;
  salary?: number;
  address?: string;
  dateOfJoining?: string;
  role?: UserRole;
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
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: ["employees"] });
      const snapshots: { key: readonly unknown[]; data: unknown }[] = [];
      queryClient.getQueriesData({ queryKey: ["employees"] }).forEach(([key, prev]) => {
        if (prev && typeof prev === "object" && "data" in (prev as any)) {
          snapshots.push({ key, data: JSON.parse(JSON.stringify(prev)) });
          const p = prev as { data: any[]; meta: any };
          queryClient.setQueryData(key, { ...p, data: [...p.data, { ...dto, id: "temp-" + Date.now() }] });
        }
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => { ctx?.snapshots?.forEach((s) => queryClient.setQueryData(s.key, s.data)); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["employees"] }); },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEmployeeDto }) =>
      api.patch<Employee>(`/employees/${id}`, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: ["employees"] });
      const snapshots: { key: readonly unknown[]; data: unknown }[] = [];
      queryClient.getQueriesData({ queryKey: ["employees"] }).forEach(([key, prev]) => {
        if (prev && typeof prev === "object" && "data" in (prev as any)) {
          snapshots.push({ key, data: JSON.parse(JSON.stringify(prev)) });
          const p = prev as { data: any[]; meta: any };
          queryClient.setQueryData(key, { ...p, data: p.data.map((item: any) => item.id === id ? { ...item, ...dto } : item) });
        }
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => { ctx?.snapshots?.forEach((s) => queryClient.setQueryData(s.key, s.data)); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["employees"] }); },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["employees"] });
      const snapshots: { key: readonly unknown[]; data: unknown }[] = [];
      queryClient.getQueriesData({ queryKey: ["employees"] }).forEach(([key, prev]) => {
        if (prev && typeof prev === "object" && "data" in (prev as any)) {
          snapshots.push({ key, data: JSON.parse(JSON.stringify(prev)) });
          const p = prev as { data: any[]; meta: any };
          queryClient.setQueryData(key, { ...p, data: p.data.filter((item: any) => item.id !== id) });
        }
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => { ctx?.snapshots?.forEach((s) => queryClient.setQueryData(s.key, s.data)); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["employees"] }); },
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
