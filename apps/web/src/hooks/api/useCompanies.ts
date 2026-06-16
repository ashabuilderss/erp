"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Company, UpdateCompanyDto } from "@/lib/types";

export function useCurrentCompany() {
  return useQuery({
    queryKey: ["company", "current"],
    queryFn: () => api.get<Company>("/companies/current"),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCompanyDto) => api.patch<Company>("/companies/current", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company"] }),
    onError: (err: ApiError) => console.error("Update company failed:", err.message),
  });
}
