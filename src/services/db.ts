import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import { DB_CONFIG } from "@/lib/constants";
import { debugLog } from "@/lib/utils";
import { createDataSource, normalizeMetrics } from "@/services/healthDataStore";
import type { HealthData, HealthDataStore } from "@/types";

interface WithingsDB extends DBSchema {
  [DB_CONFIG.STORE_NAME]: {
    key: string;
    value: HealthDataStore | HealthData;
  };
}

let dbInstance: IDBPDatabase<WithingsDB> | null = null;

async function getDB(): Promise<IDBPDatabase<WithingsDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<WithingsDB>(DB_CONFIG.NAME, DB_CONFIG.VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DB_CONFIG.STORE_NAME)) {
        db.createObjectStore(DB_CONFIG.STORE_NAME);
      }
    },
  });

  return dbInstance;
}

export async function saveHealthDataStore(
  data: HealthDataStore,
): Promise<void> {
  debugLog("Saving health data store to IndexedDB");
  const db = await getDB();
  await db.put(DB_CONFIG.STORE_NAME, data, DB_CONFIG.DATA_KEY);
}

export async function getHealthDataStore(): Promise<HealthDataStore | null> {
  debugLog("Retrieving health data store from IndexedDB");
  const db = await getDB();
  const data = await db.get(DB_CONFIG.STORE_NAME, DB_CONFIG.DATA_KEY);
  if (!data) return null;

  if ((data as HealthDataStore).sources) {
    const store = data as HealthDataStore;
    return {
      sources: store.sources ?? {},
      events: store.events ?? [],
    };
  }

  const legacy = data as HealthData;
  const source = createDataSource("withings", normalizeMetrics(legacy));
  return {
    sources: {
      [source.id]: source,
    },
    events: legacy.events ?? [],
  };
}

export async function clearHealthDataStore(): Promise<void> {
  debugLog("Clearing health data store from IndexedDB");
  const db = await getDB();
  await db.delete(DB_CONFIG.STORE_NAME, DB_CONFIG.DATA_KEY);
}
