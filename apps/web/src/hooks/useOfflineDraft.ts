"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  addDraft as dbAddDraft,
  getDrafts as dbGetDrafts,
  updateDraft as dbUpdateDraft,
  removeDraft as dbRemoveDraft,
  getDraftCount as dbGetDraftCount,
  getDraftsByEntityType,
} from "@/lib/offline-queue/db";
import {
  startSyncEngine,
  syncAll as engineSyncAll,
  syncDraft as engineSyncDraft,
  enforceStorageLimit,
} from "@/lib/offline-queue/sync-engine";
import type {
  OfflineDraft,
  DraftStatus,
  QueueStats,
} from "@/lib/offline-queue/types";
import {
  CURRENT_SCHEMA_VERSION,
  MAX_DRAFTS,
  WARNING_THRESHOLD,
} from "@/lib/offline-queue/types";

function computeStats(drafts: OfflineDraft[]): QueueStats {
  return {
    total: drafts.length,
    pending: drafts.filter((d) => d.status === "pending").length,
    synced: drafts.filter((d) => d.status === "synced").length,
    failed: drafts.filter((d) => d.status === "failed").length,
    conflict: drafts.filter((d) => d.status === "conflict").length,
    needsReview: drafts.filter((d) => d.status === "needs_review").length,
  };
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export interface UseOfflineDraftReturn {
  isOnline: boolean;
  queueStats: QueueStats;
  drafts: OfflineDraft[];
  addDraft: (entityType: string, formData: Record<string, unknown>) => Promise<string | null>;
  removeDraft: (id: string) => Promise<void>;
  retryDraft: (id: string) => Promise<void>;
  retryAll: () => Promise<void>;
  clearSynced: () => Promise<void>;
  isPending: (entityType: string, formData: Record<string, unknown>) => Promise<boolean>;
  isOverWarningThreshold: boolean;
  isAtMaxCapacity: boolean;
}

export function useOfflineDraft(): UseOfflineDraftReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const stopEngineRef = useRef<(() => void) | null>(null);

  const refreshDrafts = useCallback(async () => {
    const all = await dbGetDrafts();
    setDrafts(all);
  }, []);

  const updateDraftStatus = useCallback(
    (draftId: string, status: DraftStatus) => {
      setDrafts((prev) =>
        prev.map((d) => (d.id === draftId ? { ...d, status } : d))
      );
    },
    []
  );

  // Initialize
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load existing drafts
    dbGetDrafts().then(setDrafts);

    // Start sync engine
    stopEngineRef.current = startSyncEngine({
      onUpdate: (draftId, status) => {
        updateDraftStatus(draftId, status);
      },
      onComplete: () => {
        refreshDrafts();
      },
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      stopEngineRef.current?.();
    };
  }, [updateDraftStatus]);

  const addDraftFn = useCallback(
    async (
      entityType: string,
      formData: Record<string, unknown>
    ): Promise<string | null> => {
      // Check if at max capacity
      const count = await dbGetDraftCount();
      if (count >= MAX_DRAFTS) {
        // Try evicting oldest synced drafts
        const syncedCount = drafts.filter((d) => d.status === "synced").length;
        if (syncedCount > 0) {
          await enforceStorageLimit();
        } else {
          console.warn("[OfflineQueue] Max capacity reached. Cannot add more drafts.");
          return null;
        }
      }

      const now = Date.now();
      const draft: OfflineDraft = {
        id: generateId(),
        entityType,
        formData,
        status: "pending",
        createdAt: now,
        updatedAt: now,
        retryCount: 0,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };

      await dbAddDraft(draft);
      setDrafts((prev) => [...prev, draft]);

      // If online, try to sync immediately
      if (navigator.onLine) {
        engineSyncDraft(draft.id);
      }

      return draft.id;
    },
    [drafts]
  );

  const removeDraftFn = useCallback(async (id: string) => {
    await dbRemoveDraft(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const retryDraftFn = useCallback(async (id: string) => {
    await dbUpdateDraft(id, { status: "pending", retryCount: 0, error: undefined });
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "pending", retryCount: 0, error: undefined } : d))
    );
    engineSyncDraft(id);
  }, []);

  const retryAllFn = useCallback(async () => {
    const failed = drafts.filter((d) => d.status === "failed");
    for (const draft of failed) {
      await dbUpdateDraft(draft.id, {
        status: "pending",
        retryCount: 0,
        error: undefined,
      });
    }
    setDrafts((prev) =>
      prev.map((d) =>
        d.status === "failed"
          ? { ...d, status: "pending" as DraftStatus, retryCount: 0, error: undefined }
          : d
      )
    );
    engineSyncAll();
  }, [drafts]);

  const clearSyncedFn = useCallback(async () => {
    const synced = drafts.filter((d) => d.status === "synced");
    for (const draft of synced) {
      await dbRemoveDraft(draft.id);
    }
    setDrafts((prev) => prev.filter((d) => d.status !== "synced"));
  }, [drafts]);

  const isPendingFn = useCallback(
    async (
      entityType: string,
      formData: Record<string, unknown>
    ): Promise<boolean> => {
      const entityDrafts = await getDraftsByEntityType(entityType);
      return entityDrafts.some((d) => {
        if (d.status === "synced") return false;
        // Compare form data by JSON stringification
        return JSON.stringify(d.formData) === JSON.stringify(formData);
      });
    },
    []
  );

  const queueStats = computeStats(drafts);
  const isOverWarningThreshold = drafts.length >= WARNING_THRESHOLD;
  const isAtMaxCapacity = drafts.length >= MAX_DRAFTS;

  return {
    isOnline,
    queueStats,
    drafts,
    addDraft: addDraftFn,
    removeDraft: removeDraftFn,
    retryDraft: retryDraftFn,
    retryAll: retryAllFn,
    clearSynced: clearSyncedFn,
    isPending: isPendingFn,
    isOverWarningThreshold,
    isAtMaxCapacity,
  };
}
