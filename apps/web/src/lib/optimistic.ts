import type { QueryClient } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/lib/types";

export function optimisticPaginatedAdd<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  newItem: T,
) {
  const prev = queryClient.getQueryData<PaginatedResponse<T>>(queryKey);
  if (prev) {
    queryClient.setQueryData<PaginatedResponse<T>>(queryKey, {
      ...prev,
      data: [newItem, ...prev.data],
      meta: { ...prev.meta, total: prev.meta.total + 1, totalPages: Math.ceil((prev.meta.total + 1) / prev.meta.limit) },
    });
  }
  return prev;
}

export function optimisticPaginatedRemove<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  id: string,
  idField: keyof T = "id" as keyof T,
) {
  const prev = queryClient.getQueryData<PaginatedResponse<T>>(queryKey);
  if (prev) {
    queryClient.setQueryData<PaginatedResponse<T>>(queryKey, {
      ...prev,
      data: prev.data.filter((item) => item[idField] !== id),
      meta: { ...prev.meta, total: prev.meta.total - 1, totalPages: Math.ceil((prev.meta.total - 1) / prev.meta.limit) },
    });
  }
  return prev;
}

export function optimisticPaginatedUpdate<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  id: string,
  update: Partial<T>,
  idField: keyof T = "id" as keyof T,
) {
  const prev = queryClient.getQueryData<PaginatedResponse<T>>(queryKey);
  if (prev) {
    queryClient.setQueryData<PaginatedResponse<T>>(queryKey, {
      ...prev,
      data: prev.data.map((item) =>
        item[idField] === id ? { ...item, ...update } : item,
      ),
    });
  }
  return prev;
}

export function rollbackPaginated<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  previousData: PaginatedResponse<T> | undefined,
) {
  if (previousData) {
    queryClient.setQueryData(queryKey, previousData);
  }
}
