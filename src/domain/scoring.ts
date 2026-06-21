import type { GameCatalog } from "../content/schema";
import { buildP1PublicSummary } from "./p1/summary";
import type { DeathSummary, LifeState, Stats } from "./types";

export function calculatePublicScore({
  ageAtDeath,
  stats,
  netWorth
}: {
  ageAtDeath: number;
  stats: Stats;
  netWorth: number;
}): number {
  const averageStats = (stats.happiness + stats.health + stats.smarts + stats.looks) / 4;
  const ageScore = ageAtDeath * 10;
  const statsScore = averageStats * 8;
  const netWorthScore = Math.min(2000, Math.max(0, netWorth) / 625);

  return Math.round(ageScore + statsScore + netWorthScore);
}

export function calculateScore(life: LifeState): number {
  return calculatePublicScore({ ageAtDeath: life.age, stats: life.stats, netWorth: buildP1PublicSummary(life).netWorth });
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
  const p1Summary = buildP1PublicSummary(life);
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
    score: calculatePublicScore({ ageAtDeath: life.age, stats: life.stats, netWorth: p1Summary.netWorth }),
    netWorth: p1Summary.netWorth,
    createdAt: new Date(0).toISOString()
  };
}
