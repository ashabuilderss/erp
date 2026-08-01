export type ExportSyncStatus = "PENDING" | "SYNCING" | "COMPLETED" | "FAILED";

export interface ExportConfig {
  id: string;
  companyId: string;
  exportType: string;
  sheetId: string | null;
  sheetName: string | null;
  syncEnabled: boolean;
  syncSchedule: string | null;
  syncStatus: ExportSyncStatus;
  lastSyncedAt: string | null;
  allowedRoles: string[];
  grantedUsers: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExportConfigDto {
  exportType: string;
  sheetId?: string;
  sheetName?: string;
  syncEnabled?: boolean;
  syncSchedule?: string;
  allowedRoles: string[];
  grantedUsers?: string[];
}

export interface UpdateExportConfigDto {
  sheetId?: string;
  sheetName?: string;
  syncEnabled?: boolean;
  syncSchedule?: string;
  allowedRoles?: string[];
  grantedUsers?: string[];
}
