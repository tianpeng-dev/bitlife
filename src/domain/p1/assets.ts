import type { GameCatalog } from "../../content/schema";
import { clampStat } from "../clamp";
import { createRng } from "../rng";
import type { LifeLogEntry, LifeState, OwnedAsset } from "../types";
import { assetPriceWithCountryMultiplier } from "./countriesLaw";
import { ensureP1State } from "./defaultState";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

export function buyAsset({ life, catalog, assetId }: { life: LifeState; catalog: GameCatalog; assetId: string }) {
  const ready = ensureP1State(life);
  const config = catalog.p1.assets.find((item) => item.id === assetId);
  if (!config) throw new Error(`asset.missing:${assetId}`);
  if (ready.age < (config.requirements.minAge ?? 0)) throw new Error("activity.too_young");

  const rng = createRng(`${ready.seed}:p1:asset:buy:${assetId}:${ready.age}:${ready.assets.items.length}`);
  const rawPrice = rng.int(config.minPrice, config.maxPrice);
  const price = assetPriceWithCountryMultiplier(ready, catalog, rawPrice);
  if (ready.cash < price) throw new Error("activity.cash_too_low");

  const condition = rng.int(config.conditionMin, config.conditionMax);
  const owned: OwnedAsset = {
    id: `asset-${ready.age}-${assetId}-${rng.int(1000, 9999)}`,
    catalogId: config.id,
    nameKey: config.nameKey,
    type: config.type,
    purchasePrice: price,
    currentValue: Math.round(price * (condition / 100)),
    condition,
    debt: 0,
    acquiredAtAge: ready.age,
    stolen: false
  };
  const next = { ...ready, cash: ready.cash - price, assets: { items: [...ready.assets.items, owned] } };
  const entry = log(next, "p1.log.asset.buy", { assetId, price });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function sellAsset({ life, assetInstanceId }: { life: LifeState; assetInstanceId: string }) {
  const ready = ensureP1State(life);
  const asset = ready.assets.items.find((item) => item.id === assetInstanceId);
  if (!asset) throw new Error(`asset.instance_missing:${assetInstanceId}`);
  const nextItems = ready.assets.items.filter((item) => item.id !== assetInstanceId);
  const next = { ...ready, cash: ready.cash + asset.currentValue, assets: { items: nextItems } };
  const entry = log(next, "p1.log.asset.sell", { assetId: asset.catalogId, amount: asset.currentValue });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function tickAssets({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  const rng = createRng(`${ready.seed}:p1:asset:tick:${ready.age}`);
  const items = ready.assets.items.map((asset) => {
    const condition = clampStat(asset.condition - rng.int(0, asset.type === "vehicle" ? 8 : 4));
    const market = rng.int(92, asset.type === "home" ? 112 : 104) / 100;
    return { ...asset, condition, currentValue: Math.max(0, Math.round(asset.purchasePrice * (condition / 100) * market)) };
  });
  return { life: { ...ready, assets: { items } }, logs: [] as LifeLogEntry[] };
}
