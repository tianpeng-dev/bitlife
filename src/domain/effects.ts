import type { EffectConfig } from "../content/schema";
import { clampCash, clampRelationship, clampStat } from "./clamp";
import type { LifeState } from "./types";

export function applyEffect(life: LifeState, effect: EffectConfig): LifeState {
  const next: LifeState = structuredClone(life);

  if (effect.stats) {
    for (const [key, delta] of Object.entries(effect.stats)) {
      const statKey = key as keyof LifeState["stats"];
      next.stats[statKey] = clampStat(next.stats[statKey] + delta);
    }
  }

  if (typeof effect.cash === "number") {
    next.cash = clampCash(next.cash + effect.cash);
  }

  if (typeof effect.relationship === "number") {
    const relationshipDelta = effect.relationship;
    next.relationships = next.relationships.map((person) => ({
      ...person,
      relationship: clampRelationship(person.relationship + relationshipDelta)
    }));
  }

  if (effect.addDiseaseId && !next.diseases.some((disease) => disease.id === effect.addDiseaseId)) {
    next.diseases.push({ id: effect.addDiseaseId, severity: 10, diagnosed: false, yearsActive: 0 });
  }

  if (effect.addFlag && !next.flags.includes(effect.addFlag)) {
    next.flags.push(effect.addFlag);
  }

  return next;
}
