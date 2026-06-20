export const p1ActivityIds = ["p1_asset_buy_compact_apartment"] as const;

export type P1ActivityId = (typeof p1ActivityIds)[number];
