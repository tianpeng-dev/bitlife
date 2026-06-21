export const p1ActivityIds = ["p1_asset_buy_compact_apartment"] as const;

export type P1ActivityId = (typeof p1ActivityIds)[number];

export const p1ActivityPrefixes = {
  assetBuy: "p1_asset_buy_",
  petAdopt: "p1_pet_adopt_"
} as const;
