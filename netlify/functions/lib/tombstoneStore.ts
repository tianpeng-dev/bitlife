import { getStore } from "@netlify/blobs";
import { nanoid } from "nanoid";
import { computeTombstoneScore, type PublicTombstone, type TombstoneInput } from "./tombstoneSchema";

const INDEX_KEY = "leaderboard-index";

function store() {
  return getStore("tombstones");
}

export async function saveTombstone(input: TombstoneInput): Promise<PublicTombstone> {
  const item: PublicTombstone = {
    ...input,
    score: computeTombstoneScore(input),
    id: nanoid(12),
    createdAt: new Date().toISOString()
  };
  const blobStore = store();
  await blobStore.setJSON(item.id, item);
  const index = await listTombstones();
  const nextIndex = [item, ...index].sort((a, b) => b.score - a.score).slice(0, 100);
  // Best-effort leaderboard under concurrent submissions; Netlify Blobs has no atomic index update here.
  await blobStore.setJSON(INDEX_KEY, nextIndex);
  return item;
}

export async function getTombstone(id: string): Promise<PublicTombstone | null> {
  return store().get(id, { type: "json" }) as Promise<PublicTombstone | null>;
}

export async function listTombstones(): Promise<PublicTombstone[]> {
  const items = await store().get(INDEX_KEY, { type: "json" });
  return Array.isArray(items) ? (items as PublicTombstone[]) : [];
}
