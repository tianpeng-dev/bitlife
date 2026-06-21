import type { GameCatalog } from "../../content/schema";
import type { LifeState } from "../types";
import { ensureP1State } from "./defaultState";

export type P1ActivityGroup =
  | "assets"
  | "crime"
  | "law_prison"
  | "fame"
  | "social"
  | "pets"
  | "travel_migration"
  | "romance_family";

export interface P1ActivityCard {
  id: string;
  group: P1ActivityGroup;
  labelKey: string;
  disabled: boolean;
  reasonKey?: "availableAt";
  availableAtAge?: number;
  cost?: number;
}

function disabledByRequirements(
  life: ReturnType<typeof ensureP1State>,
  requirements: { minAge?: number; maxAge?: number; minCash?: number; minFame?: number; inPrison?: boolean; notInPrison?: boolean }
): Pick<P1ActivityCard, "disabled" | "reasonKey" | "availableAtAge"> {
  if (requirements.inPrison && !life.prison.inPrison) return { disabled: true };
  if (requirements.notInPrison && life.prison.inPrison) return { disabled: true };
  if (requirements.minAge !== undefined && life.age < requirements.minAge) {
    return { disabled: true, reasonKey: "availableAt", availableAtAge: requirements.minAge };
  }
  if (requirements.maxAge !== undefined && life.age > requirements.maxAge) return { disabled: true };
  if (requirements.minCash !== undefined && life.cash < requirements.minCash) return { disabled: true };
  if (requirements.minFame !== undefined && life.fame.score < requirements.minFame) return { disabled: true };
  return { disabled: false };
}

function p1CrimeActivityId(crimeId: string): string {
  return crimeId.startsWith("p1_crime_") ? crimeId : `p1_crime_${crimeId}`;
}

function disabledByRelationshipPrerequisite(life: ReturnType<typeof ensureP1State>, activityId: string): boolean {
  const hasLover = life.relationships.some((person) => person.alive && person.relationType === "lover");
  const hasSpouse = life.relationships.some((person) => person.alive && person.relationType === "spouse");
  const hasChild = life.relationships.some((person) => person.alive && person.relationType === "child");
  if (activityId === "p1_romance_date") return hasLover || hasSpouse;
  if (activityId === "p1_romance_propose") return !hasLover || hasSpouse;
  if (activityId === "p1_family_try_child") return !hasSpouse || life.flags.includes("p1_pregnant");
  if (activityId === "p1_romance_divorce") return !hasSpouse;
  if (activityId === "p1_family_child_time") return !hasChild;
  return false;
}

export function availableP1Activities(life: LifeState, catalog: GameCatalog): P1ActivityCard[] {
  const ready = ensureP1State(life);
  const prisonActivities = catalog.p1.prisonActivities.map((activity) => ({
    id: activity.id,
    group: "law_prison" as const,
    labelKey: activity.labelKey,
    ...disabledByRequirements(ready, activity.requirements)
  }));

  if (ready.prison.inPrison) {
    return prisonActivities;
  }

  const assets = catalog.p1.assets.map((asset) => ({
    id: `p1_asset_buy_${asset.id}`,
    group: "assets" as const,
    labelKey: asset.nameKey,
    cost: asset.minPrice,
    ...disabledByRequirements(ready, asset.requirements)
  }));

  const crimes = catalog.p1.crimes.map((crime) => ({
    id: p1CrimeActivityId(crime.id),
    group: "crime" as const,
    labelKey: crime.nameKey,
    ...disabledByRequirements(ready, crime.requirements)
  }));

  const pets = catalog.p1.pets.map((pet) => ({
    id: `p1_pet_adopt_${pet.id}`,
    group: "pets" as const,
    labelKey: pet.nameKey,
    cost: pet.minPrice,
    disabled: ready.cash < pet.minPrice
  }));

  const fameActivities = catalog.p1.fameActivities.map((activity) => ({
    id: activity.id,
    group: "fame" as const,
    labelKey: activity.labelKey,
    cost: activity.requirements.minCash,
    ...disabledByRequirements(ready, activity.requirements)
  }));

  const socialActivities = catalog.p1.socialPlatforms.map((platform) => ({
    id: `p1_social_create_${platform.id}`,
    group: "social" as const,
    labelKey: platform.nameKey,
    disabled: ready.age < platform.minAge || ready.socialAccounts.some((account) => account.platformId === platform.id),
    reasonKey: ready.age < platform.minAge ? "availableAt" as const : undefined,
    availableAtAge: ready.age < platform.minAge ? platform.minAge : undefined
  }));

  const travelActivities = catalog.p1.travelActivities.map((activity) => ({
    id: activity.id,
    group: "travel_migration" as const,
    labelKey: activity.labelKey,
    cost: activity.requirements.minCash,
    ...disabledByRequirements(ready, activity.requirements)
  }));

  const romanceActivities = catalog.p1.romanceActivities.map((activity) => ({
    id: activity.id,
    group: "romance_family" as const,
    labelKey: activity.labelKey,
    cost: activity.requirements.minCash,
    ...disabledByRequirements(ready, {
      ...activity.requirements,
      minAge: activity.id === "p1_romance_date" ? 16 : activity.requirements.minAge
    }),
    disabled:
      disabledByRequirements(ready, {
        ...activity.requirements,
        minAge: activity.id === "p1_romance_date" ? 16 : activity.requirements.minAge
      }).disabled || disabledByRelationshipPrerequisite(ready, activity.id)
  }));

  return [...assets, ...crimes, ...pets, ...fameActivities, ...socialActivities, ...travelActivities, ...romanceActivities];
}
