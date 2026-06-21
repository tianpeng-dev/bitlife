import type { Stats } from "../domain/types";

export interface TombstoneP1PublicSummary {
  netWorth: number;
  assetCount: number;
  childrenCount: number;
  petCount: number;
  prisonYears: number;
  fameScore: number;
  countriesLived: number;
}

export interface TombstoneSubmitPayload {
  seed: string;
  ageAtDeath: number;
  causeOfDeath: string;
  summary: string;
  tags: string[];
  score: number;
  stats: Stats;
  netWorth: number;
  careerTitle?: string;
  highestEducation?: string;
  displayName?: string;
  p1?: TombstoneP1PublicSummary;
}

export async function submitTombstone(payload: TombstoneSubmitPayload): Promise<{ shareId: string }> {
  const response = await fetch("/api/tombstones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Tombstone submit failed: ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("Invalid tombstone response");
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("shareId" in body) ||
    typeof body.shareId !== "string" ||
    body.shareId.trim().length === 0
  ) {
    throw new Error("Invalid tombstone response");
  }

  return { shareId: body.shareId.trim() };
}

export interface LeaderboardRow {
  id: string;
  displayName?: string;
  ageAtDeath: number;
  score: number;
  tags: string[];
  causeOfDeath: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseLeaderboardRow(value: unknown): LeaderboardRow | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const { id, displayName, ageAtDeath, score, causeOfDeath, tags } = value;

  if (
    typeof id !== "string" ||
    id.trim().length === 0 ||
    typeof ageAtDeath !== "number" ||
    !Number.isFinite(ageAtDeath) ||
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    typeof causeOfDeath !== "string" ||
    !Array.isArray(tags) ||
    !tags.every((tag) => typeof tag === "string") ||
    (displayName !== undefined && typeof displayName !== "string")
  ) {
    return undefined;
  }

  return {
    id,
    displayName,
    ageAtDeath,
    score,
    causeOfDeath,
    tags
  };
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const response = await fetch("/api/leaderboard");
  if (!response.ok) {
    throw new Error(`Leaderboard fetch failed: ${response.status}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid leaderboard response");
  }

  if (!isRecord(data) || !Array.isArray(data.rows)) {
    throw new Error("Invalid leaderboard response");
  }

  const rows: LeaderboardRow[] = [];
  for (const item of data.rows) {
    const row = parseLeaderboardRow(item);
    if (row === undefined) {
      throw new Error("Invalid leaderboard response");
    }
    rows.push(row);
  }

  return rows;
}
