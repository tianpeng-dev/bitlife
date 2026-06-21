import type { LifeState } from "../types";
import { ensureP1State } from "./defaultState";

export interface P1PublicSummary {
  netWorth: number;
  assetCount: number;
  childrenCount: number;
  petCount: number;
  prisonYears: number;
  fameScore: number;
  countriesLived: number;
}

export function buildP1PublicSummary(life: LifeState): P1PublicSummary {
  const ready = ensureP1State(life);
  const assetNetWorth = ready.assets.items.reduce((total, asset) => total + asset.currentValue - asset.debt, 0);
  const countries = new Set([ready.countryId, ...ready.migrationHistory.map((record) => record.toCountryId)]);

  return {
    netWorth: ready.cash + assetNetWorth,
    assetCount: ready.assets.items.length,
    childrenCount: ready.relationships.filter((person) => person.relationType === "child").length,
    petCount: ready.pets.filter((pet) => pet.alive).length,
    prisonYears: ready.legal.criminalRecord.reduce((total, record) => total + record.sentenceYears, 0),
    fameScore: ready.fame.score,
    countriesLived: countries.size
  };
}
