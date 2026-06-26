import { openDB, type IDBPDatabase } from "idb";
import type { OfflineDraft, DraftStatus } from "./types";

const DB_NAME = "asha-builders-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
          });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("entityType", "entityType", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export async function addDraft(draft: OfflineDraft): Promise<void> {
  const db = await getDB();
  await db.add(STORE_NAME, draft);
}

export async function getDrafts(status?: DraftStatus): Promise<OfflineDraft[]> {
  const db = await getDB();
  if (status) {
    const index = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).index("status");
    return index.getAll(status);
  }
  return db.getAll(STORE_NAME);
}

export async function updateDraft(
  id: string,
  updates: Partial<OfflineDraft>
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const existing = await store.get(id);
  if (existing) {
    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    await store.put(updated);
  }
  await tx.done;
}

export async function removeDraft(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function getPendingDrafts(): Promise<OfflineDraft[]> {
  const db = await getDB();
  const index = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).index("status");
  const pending = await index.getAll("pending");
  const failed = await index.getAll("failed");
  return [...pending, ...failed];
}

export async function getDraftCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}

export async function evictOldestSynced(): Promise<void> {
  const db = await getDB();
  const index = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).index("status");
  const synced = await index.getAll("synced");

  if (synced.length === 0) return;

  synced.sort((a, b) => a.createdAt - b.createdAt);

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  for (const draft of synced) {
    await store.delete(draft.id);
  }
  await tx.done;
}

export async function getDraftsByEntityType(entityType: string): Promise<OfflineDraft[]> {
  const db = await getDB();
  const index = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).index("entityType");
  return index.getAll(entityType);
}
