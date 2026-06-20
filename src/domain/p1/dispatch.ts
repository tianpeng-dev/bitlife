import type { GameCatalog } from "../../content/schema";
import type { LifeState } from "../types";
import { p1ActivityIds, type P1ActivityId } from "./activities";
import { buyAsset } from "./assets";
import { ensureP1State } from "./defaultState";

export function isP1Activity(activityId: string): boolean {
  return activityId.startsWith("p1_");
}

function isKnownP1Activity(activityId: string): activityId is P1ActivityId {
  return p1ActivityIds.includes(activityId as P1ActivityId);
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

  if (!isKnownP1Activity(activityId)) {
    throw new Error("p1.activity_missing");
  }

  switch (activityId) {
    case "p1_asset_buy_compact_apartment":
      return buyAsset({ life: ready, catalog, assetId: "compact_apartment" });
  }
}
