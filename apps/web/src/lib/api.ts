function filterUndefined(obj: object): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      filtered[key] = String(value);
    }
  }
  return filtered;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getStringField(data: unknown, field: "message" | "error"): string | undefined {
  if (!data || typeof data !== "object" || !(field in data)) {
    return undefined;
  }

  const value = (data as Record<string, unknown>)[field];
  return typeof value === "string" ? value : undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return getStringField(error.data, "message") ?? getStringField(error.data, "error") ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `/api/proxy${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.error || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, params?: object) => {
    const filteredParams = params ? filterUndefined(params) : undefined;
    const url = filteredParams
      ? `${endpoint}?${new URLSearchParams(filteredParams).toString()}`
      : endpoint;
    return fetchApi<T>(url, { method: "GET" });
  },
  post: <T>(endpoint: string, data?: unknown) =>
    fetchApi<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, { method: "DELETE" }),
};

export { ApiError };
export type { ApiError as ApiErrorType };
