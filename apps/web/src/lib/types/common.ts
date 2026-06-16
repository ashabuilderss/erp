export type UserRole = "ADMIN" | "HR_MANAGER" | "EMPLOYEE";

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface Company {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UpdateCompanyDto = Partial<Pick<Company, "name" | "slug" | "isActive">>;

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string | null;
  companyId: string;
  performedById: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
