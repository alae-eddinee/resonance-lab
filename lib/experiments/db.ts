import { openDB, type IDBPDatabase } from "idb";
import type { ExperimentRecord, PlatePresetRecord, StoredMediaBlob } from "./types";

const DB_NAME = "resonance-lab";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment"));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("experiments")) {
          const store = db.createObjectStore("experiments", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains("media")) {
          db.createObjectStore("media", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("platePresets")) {
          db.createObjectStore("platePresets", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveExperiment(record: ExperimentRecord): Promise<void> {
  const db = await getDb();
  await db.put("experiments", record);
}

export async function getExperiment(id: string): Promise<ExperimentRecord | undefined> {
  const db = await getDb();
  return db.get("experiments", id);
}

export async function listExperiments(): Promise<ExperimentRecord[]> {
  const db = await getDb();
  const all = await db.getAll("experiments");
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteExperiment(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("experiments", id);
  const mediaKeys = await db.getAllKeys("media");
  const tx = db.transaction("media", "readwrite");
  for (const key of mediaKeys) {
    const item = (await tx.store.get(key)) as StoredMediaBlob | undefined;
    if (item?.experimentId === id) await tx.store.delete(key);
  }
  await tx.done;
}

export async function saveMediaBlob(item: StoredMediaBlob): Promise<void> {
  const db = await getDb();
  await db.put("media", item);
}

export async function getMediaBlob(id: string): Promise<StoredMediaBlob | undefined> {
  const db = await getDb();
  return db.get("media", id);
}

export async function listPlatePresets(): Promise<PlatePresetRecord[]> {
  const db = await getDb();
  return db.getAll("platePresets");
}

export async function savePlatePreset(preset: PlatePresetRecord): Promise<void> {
  const db = await getDb();
  await db.put("platePresets", preset);
}

export async function deletePlatePreset(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("platePresets", id);
}

export async function estimateStorageUsage(): Promise<{ usageBytes: number; quotaBytes: number } | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return { usageBytes: estimate.usage ?? 0, quotaBytes: estimate.quota ?? 0 };
}
