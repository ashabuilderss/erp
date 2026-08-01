export type ExportFormat = "CSV" | "EXCEL" | "SHEET" | "PDF";

export type ReportExportStatus =
  | "REQUESTED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface ReportExport {
  id: string;
  companyId: string;
  reportKey: string;
  title: string;
  format: ExportFormat;
  status: ReportExportStatus;
  filters: Record<string, unknown> | null;
  fileUrl: string | null;
  fileSize: number | null;
  generatedById: string;
  generatedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface ReportExportWithBuffer extends ReportExport {
  bufferBase64: string;
  mimeType: string;
  fileExtension: string;
  summary: string;
}

export interface QueryReportExportsDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateReportExportDto {
  reportKey: string;
  format: ExportFormat;
  dateFrom?: string;
  dateTo?: string;
  filters?: Record<string, unknown>;
}
