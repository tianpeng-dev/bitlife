import type { GameCatalog } from "../../content/schema";
import type { LifeState } from "../types";
import { p1ActivityPrefixes } from "./activities";
import { buyAsset } from "./assets";
import { attemptCrime } from "./crimeJustice";
import { ensureP1State } from "./defaultState";
import { adoptPet } from "./pets";

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

  throw new Error("p1.activity_missing");
}
