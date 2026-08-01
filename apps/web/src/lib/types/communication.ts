export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type AnnouncementPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Announcement {
  id: string;
  companyId: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  targetRoles: string[];
  targetEmployees: string[];
  status: AnnouncementStatus;
  expiresAt: string | null;
  publishedAt: string | null;
  createdById: string;
  createdAt: string;
  users?: { id: string; firstName: string; lastName: string };
  _count?: { receipts: number };
}

export interface AnnouncementReceipt {
  id: string;
  announcementId: string;
  userId: string;
  readAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  users?: { id: string; firstName: string; lastName: string; email: string };
}

export interface AnnouncementReceiptsResponse {
  receipts: AnnouncementReceipt[];
  counts: {
    total: number;
    readCount: number;
    acknowledgedCount: number;
  };
}

export interface QueryAnnouncementsDto {
  page?: number;
  limit?: number;
  status?: AnnouncementStatus;
}

export interface CreateAnnouncementDto {
  title: string;
  body: string;
  priority?: AnnouncementPriority;
  targetRoles: string[];
  targetEmployees: string[];
  expiresAt?: string;
}

export interface PublishAnnouncementDto {
  announcementId: string;
}

export interface ArchiveAnnouncementDto {
  announcementId: string;
}
