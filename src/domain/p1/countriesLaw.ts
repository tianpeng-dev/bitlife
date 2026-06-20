import type { GameCatalog } from "../../content/schema";
import type { LifeState } from "../types";

export type LawCheck = { law: "gambling" | "marriage" | "emigration" };
export type LawDenialReason =
  | "law.gambling_illegal"
  | "law.too_young_for_marriage"
  | "law.emigration_blocked"
  | undefined;

export function countryLawFor(life: LifeState, catalog: GameCatalog) {
  return catalog.p1.countryLaw.find((law) => law.countryId === life.countryId) ?? catalog.p1.countryLaw[0];
}

export function activityDeniedByLaw(life: LifeState, catalog: GameCatalog, check: LawCheck): LawDenialReason {
  const law = countryLawFor(life, catalog);
  if (check.law === "gambling" && !law.gamblingLegal) return "law.gambling_illegal";
  if (check.law === "marriage" && life.age < law.marriageAge) return "law.too_young_for_marriage";
  if (check.law === "emigration" && law.immigrationDifficulty >= 0.95) return "law.emigration_blocked";
  return undefined;
}

export function sentenceYearsForCrime(life: LifeState, catalog: GameCatalog, severity: number): number {
  const law = countryLawFor(life, catalog);
  return Math.max(1, Math.round(severity * law.prisonSeverity));
}

export function assetPriceWithCountryMultiplier(life: LifeState, catalog: GameCatalog, amount: number): number {
  const law = countryLawFor(life, catalog);
  return Math.max(0, Math.round(amount * law.assetCostMultiplier));
}
