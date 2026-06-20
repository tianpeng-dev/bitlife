import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { buyAsset, sellAsset, tickAssets } from "../domain/p1/assets";
import { ensureP1State } from "../domain/p1/defaultState";

describe("P1 assets", () => {
  it("buys an affordable asset and updates net worth state", () => {
    const life = ensureP1State({ ...generateLife({ seed: "asset-buy", catalog }), age: 18, cash: 200000 });
    const result = buyAsset({ life, catalog, assetId: "compact_apartment" });

    expect(result.life.cash).toBeLessThan(life.cash);
    expect(result.life.assets.items).toHaveLength(1);
    expect(result.logs[0].messageKey).toBe("p1.log.asset.buy");
  });

  it("rejects unaffordable asset purchases", () => {
    const life = ensureP1State({ ...generateLife({ seed: "asset-poor", catalog }), age: 18, cash: 10 });

    expect(() => buyAsset({ life, catalog, assetId: "compact_apartment" })).toThrow(/activity.cash_too_low/);
  });

  it("sells an owned asset for current value", () => {
    const bought = buyAsset({
      life: ensureP1State({ ...generateLife({ seed: "asset-sell", catalog }), age: 18, cash: 200000 }),
      catalog,
      assetId: "compact_apartment"
    }).life;
    const ownedId = bought.assets.items[0].id;
    const sold = sellAsset({ life: bought, assetInstanceId: ownedId });

    expect(sold.life.assets.items).toHaveLength(0);
    expect(sold.life.cash).toBeGreaterThan(bought.cash);
  });

  it("ages assets without invalid condition values", () => {
    const bought = buyAsset({
      life: ensureP1State({ ...generateLife({ seed: "asset-tick", catalog }), age: 18, cash: 200000 }),
      catalog,
      assetId: "used_hatchback"
    }).life;
    const ticked = tickAssets({ life: bought, catalog });

    expect(ticked.life.assets.items[0].condition).toBeGreaterThanOrEqual(0);
    expect(ticked.life.assets.items[0].condition).toBeLessThanOrEqual(100);
  });
});
