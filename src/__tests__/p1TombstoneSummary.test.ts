import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { buyAsset } from "../domain/p1/assets";
import { ensureP1State } from "../domain/p1/defaultState";
import { buildP1PublicSummary } from "../domain/p1/summary";
import { buildDeathSummary } from "../domain/scoring";

describe("P1 tombstone summary", () => {
  it("counts owned assets and includes asset value in net worth", () => {
    const life = buyAsset({
      life: ensureP1State({ ...generateLife({ seed: "p1-summary-asset", catalog }), age: 30, cash: 200_000 }),
      catalog,
      assetId: "compact_apartment"
    }).life;

    const summary = buildP1PublicSummary(life);

    expect(summary.assetCount).toBe(1);
    expect(summary.netWorth).toBeGreaterThan(life.cash);
  });

  it("uses P1 net worth in death summaries", () => {
    const life = buyAsset({
      life: ensureP1State({
        ...generateLife({ seed: "p1-summary-death", catalog }),
        age: 90,
        cash: 200_000,
        alive: false
      }),
      catalog,
      assetId: "compact_apartment"
    }).life;

    const summary = buildDeathSummary({ life, catalog, causeOfDeath: "old_age" });

    expect(summary.netWorth).toBeGreaterThanOrEqual(life.cash);
  });

  it("counts only living pets in public summaries", () => {
    const life = ensureP1State({
      ...generateLife({ seed: "p1-summary-pets", catalog }),
      pets: [
        {
          id: "pet-living",
          catalogId: "p1_pet_cat",
          name: "Mimi",
          age: 3,
          health: 80,
          relationship: 70,
          alive: true
        },
        {
          id: "pet-dead",
          catalogId: "p1_pet_cat",
          name: "Mimi",
          age: 18,
          health: 0,
          relationship: 80,
          alive: false
        }
      ]
    });

    expect(buildP1PublicSummary(life).petCount).toBe(1);
  });
});
