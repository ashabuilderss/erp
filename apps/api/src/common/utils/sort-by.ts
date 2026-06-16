export function safeSortBy<T extends string>(
  sortBy: string | undefined,
  allowedFields: readonly T[],
  defaultField: T,
): T {
  if (sortBy && (allowedFields as readonly string[]).includes(sortBy)) {
    return sortBy as T;
  }
  return defaultField;
}
