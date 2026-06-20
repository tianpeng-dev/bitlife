import { catalog } from "../content/catalog";
import { advanceYear, performActivity } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import { buyAsset } from "../domain/p1/assets";
import { ensureP1State } from "../domain/p1/defaultState";

describe("P1 engine integration", () => {
  it("runs P1 yearly ticks during age-up", () => {
    const bought = buyAsset({
      life: ensureP1State({ ...generateLife({ seed: "p1-engine-tick-assets-0", catalog }), age: 18, cash: 200000 }),
      catalog,
      assetId: "used_hatchback"
    }).life;
    const beforeCondition = bought.assets.items[0].condition;

    const result = advanceYear({ life: bought, catalog });
    const advanced = ensureP1State(result.life);

    expect(advanced.age).toBe(19);
    expect(advanced.assets.items).toHaveLength(1);
    expect(advanced.assets.items[0].condition).toBeLessThan(beforeCondition);
  });

  it("dispatches P1 asset activity ids through performActivity", () => {
    const life = ensureP1State({
      ...generateLife({ seed: "p1-engine-dispatch-asset", catalog }),
      age: 18,
      cash: 200000
    });

    const result = performActivity({ life, catalog, activityId: "p1_asset_buy_compact_apartment" });
    const dispatched = ensureP1State(result.life);

    expect(dispatched.assets.items).toHaveLength(1);
    expect(dispatched.assets.items[0].catalogId).toBe("compact_apartment");
    expect(result.logs[0].messageKey).toBe("p1.log.asset.buy");
  });

  it("denies ordinary P0 activities while in prison", () => {
    const life = ensureP1State({
      ...generateLife({ seed: "p1-engine-prison-p0-denied", catalog }),
      age: 18,
      prison: {
        inPrison: true,
        sentenceYears: 3,
        remainingYears: 2,
        securityLevel: "minimum",
        behavior: 50,
        respect: 20
      }
    });

    expect(() => performActivity({ life, catalog, activityId: "exercise" })).toThrow(/prison.normal_activity_denied/);
  });
});
