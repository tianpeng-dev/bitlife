import { openDB } from "idb";
import type { LifeState } from "../domain/types";

const DB_NAME = "text-life-db";
const DB_VERSION = 1;

async function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("saves")) {
        database.createObjectStore("saves");
      }
      if (!database.objectStoreNames.contains("tombstones")) {
        database.createObjectStore("tombstones", { keyPath: "id" });
      }
    }
  });
}

export async function saveActiveLife(life: LifeState): Promise<void> {
  const database = await db();
  await database.put("saves", life, "active");
}

export async function loadActiveLife(): Promise<LifeState | undefined> {
  const database = await db();
  return database.get("saves", "active");
}

export async function clearActiveLife(): Promise<void> {
  const database = await db();
  await database.delete("saves", "active");
}
