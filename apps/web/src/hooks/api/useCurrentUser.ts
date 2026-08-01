"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { UserRole } from "@/lib/constants";

export interface CurrentUserData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
  employee: { id: string; employeeCode: string } | null;
  permissions: string[];
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<CurrentUserData>("/auth/me"),
    staleTime: 30000,
    retry: 1,
  });
}
