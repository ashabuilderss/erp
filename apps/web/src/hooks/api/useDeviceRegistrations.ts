"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { DeviceRegistration, CreateDeviceRegistrationDto } from "@/lib/types";

export function useDeviceRegistrations() {
  return useQuery({
    queryKey: ["device-registrations"],
    queryFn: () => api.get<{ data: DeviceRegistration[]; meta: any }>("/device-registrations"),
  });
}

export function useMyDevices() {
  return useQuery({
    queryKey: ["device-registrations", "me"],
    queryFn: () => api.get<DeviceRegistration[]>("/device-registrations/me"),
  });
}

export function useCreateDeviceRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDeviceRegistrationDto) => api.post<DeviceRegistration>("/device-registrations", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-registrations"] });
    },
    onError: (err: ApiError) => console.error("Create device registration failed:", err.message),
  });
}

export function useDeleteDeviceRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/device-registrations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-registrations"] });
    },
    onError: (err: ApiError) => console.error("Delete device registration failed:", err.message),
  });
}
