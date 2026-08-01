export type DocumentCategory =
  | "GENERAL"
  | "CONTRACT"
  | "INVOICE"
  | "REPORT"
  | "PHOTO"
  | "DRAWING"
  | "CERTIFICATE";

export type DocumentAccessLevel = "COMPANY" | "RESTRICTED";

export type DocumentStatus = "ACTIVE" | "DELETED";

export interface DocumentRegistry {
  id: string;
  companyId: string;
  name: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  storageObjectId: string;
  uploadedById: string;
  accessLevel: DocumentAccessLevel;
  status: DocumentStatus;
  createdAt: string;
  storageObjects?: {
    id: string;
    bucketName: string;
    objectKey: string;
    checksum: string;
  };
  users?: { id: string; firstName: string; lastName: string };
}

export interface DocumentAccessLog {
  id: string;
  documentId: string;
  userId: string;
  action: string;
  createdAt: string;
  users?: { id: string; firstName: string; lastName: string; email: string };
}

export interface DocumentAccessStats {
  totalAccesses: number;
  uniqueUserCount: number;
}

export interface QueryDocumentsDto {
  page?: number;
  limit?: number;
  category?: DocumentCategory;
}

export interface RegisterDocumentDto {
  name: string;
  fileType: string;
  fileSize: number;
  category?: DocumentCategory;
  storageObjectId: string;
  accessLevel?: DocumentAccessLevel;
}

export interface LogDocumentAccessDto {
  documentId: string;
  action: string;
}

export interface QueryDocumentAccessLogsDto {
  page?: number;
  limit?: number;
}
