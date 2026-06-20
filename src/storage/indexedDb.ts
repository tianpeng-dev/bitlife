import { openDB } from "idb";
import type { LifeState } from "../domain/types";
import { migrateLifeState } from "./migrations";

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
  await database.put("saves", migrateLifeState(life), "active");
}

export async function saveCompletedLife(life: LifeState): Promise<void> {
  if (!life.death) return;

  const database = await db();
  await database.put("tombstones", migrateLifeState(life));
}

export async function listCompletedLives(): Promise<LifeState[]> {
  const database = await db();
  const lives = await database.getAll("tombstones");
  return lives.map(migrateLifeState);
}

export async function loadActiveLife(): Promise<LifeState | undefined> {
  const database = await db();
  const life = await database.get("saves", "active");
  return life ? migrateLifeState(life) : undefined;
}

export async function clearActiveLife(): Promise<void> {
  const database = await db();
  await database.delete("saves", "active");
}
