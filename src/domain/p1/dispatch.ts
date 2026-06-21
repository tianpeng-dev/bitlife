import type { GameCatalog } from "../../content/schema";
import type { P1ActionConfig } from "../../content/p1/schema";
import { clampRelationship, clampStat } from "../clamp";
import type { LifeLogEntry, LifeState } from "../types";
import { p1ActivityPrefixes } from "./activities";
import { buyAsset } from "./assets";
import { attemptCrime } from "./crimeJustice";
import { ensureP1State } from "./defaultState";
import { createSocialAccount } from "./fameSocial";
import { adoptPet } from "./pets";
import { paroleAttempt } from "./prison";
import { adoptChild, divorcePartner, proposeMarriage, startDating, startPregnancy } from "./romanceFamily";
import { attemptEmigration, attemptIllegalEmigration, takeVacation } from "./travelMigration";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

function assertActionRequirements(life: ReturnType<typeof ensureP1State>, action: P1ActionConfig): void {
  const requirements = action.requirements;
  if (requirements.inPrison && !life.prison.inPrison) throw new Error("prison.not_in_prison");
  if (requirements.notInPrison && life.prison.inPrison) throw new Error("prison.normal_activity_denied");
  if (requirements.minAge !== undefined && life.age < requirements.minAge) throw new Error("activity.too_young");
  if (requirements.maxAge !== undefined && life.age > requirements.maxAge) throw new Error("activity.too_old");
  if (requirements.minCash !== undefined && life.cash < requirements.minCash) throw new Error("activity.cash_too_low");
  if (requirements.minFame !== undefined && life.fame.score < requirements.minFame) throw new Error("activity.fame_too_low");
}

function applyActionEffects({
  life,
  action,
  messageKey
}: {
  life: ReturnType<typeof ensureP1State>;
  action: P1ActionConfig;
  messageKey?: string;
}) {
  assertActionRequirements(life, action);
  const effects = action.effects;
  const relationshipDelta = effects.relationship ?? 0;
  const next = {
    ...life,
    cash: life.cash + (effects.cash ?? 0),
    stats: {
      ...life.stats,
      happiness: clampStat(life.stats.happiness + (effects.happiness ?? 0)),
      health: clampStat(life.stats.health + (effects.health ?? 0)),
      smarts: clampStat(life.stats.smarts + (effects.smarts ?? 0)),
      looks: clampStat(life.stats.looks + (effects.looks ?? 0))
    },
    fame: {
      ...life.fame,
      score: clampStat(life.fame.score + (effects.fame ?? 0))
    },
    relationships: relationshipDelta === 0
      ? life.relationships
      : life.relationships.map((person) => ({
          ...person,
          relationship: clampRelationship(person.relationship + relationshipDelta)
        })),
    prison: effects.prisonTime === undefined
      ? life.prison
      : {
          ...life.prison,
          remainingYears: Math.max(0, life.prison.remainingYears + effects.prisonTime)
        }
  };
  const entry = log(next, messageKey ?? action.resultKey, { activityId: action.id });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

function alternateCountryId(life: LifeState, catalog: GameCatalog): string {
  return catalog.p1.countryLaw.find((law) => law.countryId !== life.countryId)?.countryId ?? catalog.p1.countryLaw[0]?.countryId ?? life.countryId;
}

export function isP1Activity(activityId: string): boolean {
  return activityId.startsWith("p1_");
}

export function dispatchP1Activity({
  life,
  catalog,
  activityId
}: {
  life: LifeState;
  catalog: GameCatalog;
  activityId: string;
}) {
  const ready = ensureP1State(life);
  if (ready.prison.inPrison && !activityId.startsWith("p1_prison_")) {
    throw new Error("prison.normal_activity_denied");
  }

  if (activityId.startsWith(p1ActivityPrefixes.assetBuy)) {
    const assetId = activityId.slice(p1ActivityPrefixes.assetBuy.length);
    if (catalog.p1.assets.some((asset) => asset.id === assetId)) {
      return buyAsset({ life: ready, catalog, assetId });
    }
  }

  if (catalog.p1.crimes.some((crime) => crime.id === activityId)) {
    return attemptCrime({ life: ready, catalog, crimeId: activityId });
  }

  if (activityId.startsWith(p1ActivityPrefixes.petAdopt)) {
    const petId = activityId.slice(p1ActivityPrefixes.petAdopt.length);
    if (catalog.p1.pets.some((pet) => pet.id === petId)) {
      return adoptPet({ life: ready, catalog, petId });
    }
  }

  if (activityId.startsWith(p1ActivityPrefixes.socialCreate)) {
    const platformId = activityId.slice(p1ActivityPrefixes.socialCreate.length);
    if (catalog.p1.socialPlatforms.some((platform) => platform.id === platformId)) {
      return createSocialAccount({ life: ready, catalog, platformId });
    }
  }

  const prisonAction = catalog.p1.prisonActivities.find((action) => action.id === activityId);
  if (prisonAction) {
    if (activityId === "p1_prison_parole") return paroleAttempt({ life: ready, catalog });
    return applyActionEffects({ life: ready, action: prisonAction, messageKey: prisonAction.resultKey });
  }

  const fameAction = catalog.p1.fameActivities.find((action) => action.id === activityId);
  if (fameAction) {
    return applyActionEffects({ life: ready, action: fameAction, messageKey: fameAction.resultKey });
  }

  const travelAction = catalog.p1.travelActivities.find((action) => action.id === activityId);
  if (travelAction) {
    assertActionRequirements(ready, travelAction);
    const toCountryId = alternateCountryId(ready, catalog);
    if (activityId === "p1_migration_legal") return attemptEmigration({ life: ready, catalog, toCountryId });
    if (activityId === "p1_migration_illegal") return attemptIllegalEmigration({ life: ready, catalog, toCountryId });
    return takeVacation({ life: ready, catalog, toCountryId });
  }

  const romanceAction = catalog.p1.romanceActivities.find((action) => action.id === activityId);
  if (romanceAction) {
    assertActionRequirements(ready, romanceAction);
    if (activityId === "p1_romance_date") return startDating({ life: ready, catalog });
    if (activityId === "p1_romance_propose") return proposeMarriage({ life: ready, catalog });
    if (activityId === "p1_family_try_child") return startPregnancy({ life: ready, catalog });
    if (activityId === "p1_family_adopt") return adoptChild({ life: ready, catalog });
    if (activityId === "p1_romance_divorce") return divorcePartner({ life: ready, catalog });
    return applyActionEffects({ life: ready, action: romanceAction, messageKey: romanceAction.resultKey });
  }

  throw new Error("p1.activity_missing");
}
