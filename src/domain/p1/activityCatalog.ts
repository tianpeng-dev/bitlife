import type { GameCatalog } from "../../content/schema";
import type { LifeState } from "../types";

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

function disabledByMinAge(
  life: LifeState,
  minAge?: number
): Pick<P1ActivityCard, "disabled" | "reasonKey" | "availableAtAge"> {
  const disabled = minAge !== undefined && life.age < minAge;
  return disabled ? { disabled, reasonKey: "availableAt", availableAtAge: minAge } : { disabled };
}

function p1CrimeActivityId(crimeId: string): string {
  return crimeId.startsWith("p1_crime_") ? crimeId : `p1_crime_${crimeId}`;
}

export function availableP1Activities(life: LifeState, catalog: GameCatalog): P1ActivityCard[] {
  const assets = catalog.p1.assets.map((asset) => ({
    id: `p1_asset_buy_${asset.id}`,
    group: "assets" as const,
    labelKey: asset.nameKey,
    cost: asset.minPrice,
    ...disabledByMinAge(life, asset.requirements.minAge)
  }));

  const crimes = catalog.p1.crimes.map((crime) => ({
    id: p1CrimeActivityId(crime.id),
    group: "crime" as const,
    labelKey: crime.nameKey,
    ...disabledByMinAge(life, crime.requirements.minAge)
  }));

  const pets = catalog.p1.pets.map((pet) => ({
    id: `p1_pet_adopt_${pet.id}`,
    group: "pets" as const,
    labelKey: pet.nameKey,
    cost: pet.minPrice,
    disabled: false
  }));

  return [...assets, ...crimes, ...pets];
}
