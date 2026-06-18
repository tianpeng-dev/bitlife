import type { GameCatalog } from "../content/schema";
import type { DeathSummary, LifeState } from "./types";

export function calculateScore(life: LifeState): number {
  const averageStats = (life.stats.happiness + life.stats.health + life.stats.smarts + life.stats.looks) / 4;
  const relationshipScore =
    life.relationships.reduce((sum, person) => sum + person.relationship, 0) / Math.max(1, life.relationships.length);
  const cashScore = Math.max(0, Math.min(100, life.cash / 1000));
  return Math.round(life.age * 10 + averageStats * 4 + relationshipScore * 2 + cashScore);
}

export function selectTombstoneTags(life: LifeState): string[] {
  const tags: string[] = [];
  if (life.age >= 85) tags.push("long_life");
  if (life.stats.smarts >= 80) tags.push("bright");
  if (life.relationships.some((person) => person.relationship >= 85)) tags.push("beloved");
  if (life.cash >= 50_000) tags.push("wealthy");
  if (life.age < 30 || life.flags.includes("kept_wallet")) tags.push("unlucky");
  if (tags.length === 0) tags.push("ordinary");
  return tags;
}

export function buildDeathSummary({
  life,
  catalog,
  causeOfDeath
}: {
  life: LifeState;
  catalog: GameCatalog;
  causeOfDeath: string;
}): DeathSummary {
  const tags = selectTombstoneTags(life);
  const achievementIds = new Set(catalog.achievements.map((achievement) => achievement.id));
  const missingTag = tags.find((tag) => !achievementIds.has(tag));
  if (missingTag) {
    throw new Error(`Missing achievement for tombstone tag ${missingTag}`);
  }

  return {
    ageAtDeath: life.age,
    causeOfDeath,
    summaryKey: "death.summary",
    tags,
    score: calculateScore(life),
    netWorth: life.cash,
    createdAt: new Date(0).toISOString()
  };
}
