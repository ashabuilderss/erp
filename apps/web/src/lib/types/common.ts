export type UserRole = "OWNER" | "ADMIN" | "HR_MANAGER" | "ACCOUNTS" | "MANAGER" | "TEAM_LEAD" | "EMPLOYEE" | "FIELD_EMPLOYEE";

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
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export type UpdateCompanyDto = Partial<Pick<Company, "name" | "slug" | "isActive">> & { settings?: Record<string, unknown> };

export interface SystemSettings {
  debugLogging: boolean;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  maxLoginAttempts: number;
  encryptSensitiveFields: boolean;
  allowedIpAddresses: string[];
  mfaRequired: boolean;
}

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
