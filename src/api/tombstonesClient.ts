import type { Stats } from "../domain/types";

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
