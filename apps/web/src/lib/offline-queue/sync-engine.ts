import {
  getPendingDrafts,
  updateDraft,
  getDrafts,
  evictOldestSynced,
  getDraftCount,
} from "./db";
import type { OfflineDraft } from "./types";
import { MAX_RETRIES, RETRY_DELAYS, CURRENT_SCHEMA_VERSION, MAX_DRAFTS } from "./types";

export type SyncUpdateCallback = (draftId: string, status: OfflineDraft["status"]) => void;
export type SyncErrorCallback = (draftId: string, error: string) => void;

interface SyncEngineCallbacks {
  onUpdate?: SyncUpdateCallback;
  onError?: SyncErrorCallback;
  onComplete?: () => void;
}

let isRunning = false;
let stopFlag = false;
let callbacks: SyncEngineCallbacks = {};

function getEntityEndpoint(entityType: string): string {
  // Pluralize entity type for API endpoint
  // e.g., 'expense-claim' -> '/api/proxy/expense-claims'
  return `/api/proxy/${entityType}s`;
}

async function syncDraftInternal(draft: OfflineDraft): Promise<void> {
  const endpoint = getEntityEndpoint(draft.entityType);
  const body = JSON.stringify(draft.formData);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Draft-Id": draft.id,
      "X-Schema-Version": String(draft.schemaVersion),
    },
    body,
  });

  if (response.status === 409) {
    // Conflict – server has a newer version
    let serverVersion: Record<string, unknown> | undefined;
    try {
      serverVersion = await response.json();
    } catch {
      serverVersion = { raw: await response.text() };
    }

    await updateDraft(draft.id, {
      status: "conflict",
      serverVersion: serverVersion ?? undefined,
      error: "Server has a newer version. Manual review required.",
    });
    callbacks.onUpdate?.(draft.id, "conflict");
    return;
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  // Success
  await updateDraft(draft.id, {
    status: "synced",
    syncedAt: Date.now(),
    error: undefined,
  });
  callbacks.onUpdate?.(draft.id, "synced");
}

async function processDraft(draft: OfflineDraft): Promise<void> {
  // Check schema version
  if (draft.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    await updateDraft(draft.id, {
      status: "needs_review",
      error: `Schema version mismatch (draft: ${draft.schemaVersion}, current: ${CURRENT_SCHEMA_VERSION}). Manual review required.`,
    });
    callbacks.onUpdate?.(draft.id, "needs_review");
    return;
  }

  await updateDraft(draft.id, {
    status: "syncing",
    error: undefined,
  });
  callbacks.onUpdate?.(draft.id, "syncing");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (stopFlag) return;

    try {
      await syncDraftInternal(draft);
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delayIndex = Math.min(attempt, RETRY_DELAYS.length - 1);
        const delay = RETRY_DELAYS[delayIndex];

        await updateDraft(draft.id, {
          retryCount: attempt + 1,
          error: `Retry ${attempt + 1}/${MAX_RETRIES}: ${lastError.message}`,
        });
        callbacks.onUpdate?.(draft.id, "syncing");

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  await updateDraft(draft.id, {
    status: "failed",
    retryCount: MAX_RETRIES,
    error: lastError?.message ?? "Max retries exceeded",
  });
  callbacks.onUpdate?.(draft.id, "failed");
  callbacks.onError?.(draft.id, lastError?.message ?? "Max retries exceeded");
}

async function processQueue(): Promise<void> {
  if (isRunning || stopFlag) return;
  isRunning = true;

  try {
    // Check storage limits before syncing
    const totalCount = await getDraftCount();
    if (totalCount >= 40) {
      console.warn(
        `[OfflineQueue] Draft count is ${totalCount}. Consider clearing synced drafts.`
      );
    }

    const pendingDrafts = await getPendingDrafts();

    // Sort by createdAt (oldest first)
    pendingDrafts.sort((a, b) => a.createdAt - b.createdAt);

    for (const draft of pendingDrafts) {
      if (stopFlag) break;
      await processDraft(draft);
    }
  } finally {
    isRunning = false;
    callbacks.onComplete?.();
  }
}

function handleOnline(): void {
  if (!stopFlag) {
    processQueue();
  }
}

function handleOffline(): void {
  // No action needed when going offline
}

/**
 * Start the sync engine. Listens to online/offline events and processes the queue.
 * Returns a stop function to clean up.
 */
export function startSyncEngine(engineCallbacks: SyncEngineCallbacks): () => void {
  callbacks = engineCallbacks;
  stopFlag = false;

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // If already online, process the queue immediately
    if (navigator.onLine) {
      processQueue();
    }
  }

  return () => {
    stopFlag = true;
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    }
    callbacks = {};
  };
}

/**
 * Stop the sync engine.
 */
export function stopSyncEngine(): void {
  stopFlag = true;
  if (typeof window !== "undefined") {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  }
  callbacks = {};
}

/**
 * Manually trigger sync of all pending/failed drafts.
 */
export async function syncAll(): Promise<void> {
  await processQueue();
}

/**
 * Sync a single draft by ID.
 */
export async function syncDraft(id: string): Promise<void> {
  const drafts = await getDrafts();
  const draft = drafts.find((d) => d.id === id);
  if (!draft) return;

  await processDraft(draft);
}

/**
 * Check if the storage is approaching the limit and evict if needed.
 * Should be called after adding a new draft.
 */
export async function enforceStorageLimit(): Promise<void> {
  const count = await getDraftCount();
  if (count > MAX_DRAFTS) {
    const toEvict = count - MAX_DRAFTS;
    for (let i = 0; i < toEvict; i++) {
      await evictOldestSynced();
    }
  }
}
