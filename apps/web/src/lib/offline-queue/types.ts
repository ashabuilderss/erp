export type DraftStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "failed"
  | "conflict"
  | "needs_review";

export interface OfflineDraft {
  id: string;
  entityType: string; // e.g., 'expense-claim', 'leave-request', 'complaint'
  formData: Record<string, unknown>;
  status: DraftStatus;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
  retryCount: number;
  schemaVersion: number;
  error?: string;
  serverVersion?: Record<string, unknown>; // snapshot of server state at last sync attempt
}

export interface QueueStats {
  total: number;
  pending: number;
  synced: number;
  failed: number;
  conflict: number;
  needsReview: number;
}

export const CURRENT_SCHEMA_VERSION = 1;

export const MAX_DRAFTS = 50;
export const MAX_RETRIES = 10;
export const WARNING_THRESHOLD = 40;

export const RETRY_DELAYS = [1_000, 2_000, 4_000, 8_000, 16_000, 60_000];
