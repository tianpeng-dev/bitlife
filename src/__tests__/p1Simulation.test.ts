import { catalog } from "../content/catalog";
import { p1Catalog } from "../content/p1/catalog";
import { validateP1Catalog } from "../content/p1/validation";
import { advanceYear, performActivity } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";

describe("P1 fixed-seed simulation", () => {
  it("runs a long ordinary P1 life without uncaught errors", () => {
    let life = ensureP1State({ ...generateLife({ seed: "p1-fixed-seed-long-life", catalog }), cash: 200000 });
    let boughtHome = false;

    for (let year = 0; year < 60 && life.alive; year += 1) {
      if (life.age === 18 && !boughtHome) {
        life = ensureP1State(
          performActivity({ life, catalog, activityId: "p1_asset_buy_compact_apartment" }).life
        );
        boughtHome = true;
      }

      life = ensureP1State(advanceYear({ life: { ...life, pendingEventId: undefined }, catalog }).life);
    }

    expect(life.age).toBeGreaterThanOrEqual(60);
    expect(life.assets).toBeDefined();
    expect(life.legal).toBeDefined();
    expect(life.pets).toBeDefined();
    expect(() => validateP1Catalog(catalog.p1)).not.toThrow();
  });
});

describe("P1 heavy catalog validation", () => {
  it("rejects unfinished placeholder markers in visible locale text", () => {
    const invalid = structuredClone(p1Catalog);
    invalid.locales["en-US"]["p1.asset.compact_apartment.name"] = "TODO Compact Apartment";

    expect(() => validateP1Catalog(invalid)).toThrow(/Unfinished P1 locale marker/);
  });

  it("rejects whitespace-only visible locale text", () => {
    const invalid = structuredClone(p1Catalog);
    invalid.locales["en-US"]["p1.asset.compact_apartment.name"] = "   ";

    expect(() => validateP1Catalog(invalid)).toThrow(/Missing en-US P1 locale keys/);
  });

  it("rejects suspicious repeated visible locale strings", () => {
    const invalid = structuredClone(p1Catalog);
    invalid.locales["en-US"]["p1.asset.compact_apartment.name"] = "Duplicated Visible Name";
    invalid.locales["en-US"]["p1.asset.used_hatchback.name"] = "Duplicated Visible Name";

    expect(() => validateP1Catalog(invalid)).toThrow(/Duplicate visible P1 locale value/);
  });

  it("rejects generated crime probability sums above one", () => {
    const invalid = structuredClone(p1Catalog);
    invalid.crimes[0].baseSuccess = 0.8;
    invalid.crimes[0].baseArrest = 0.4;

    expect(() => validateP1Catalog(invalid)).toThrow(/Invalid P1 crime probability sum/);
  });

  it("rejects contradictory action prison requirements", () => {
    const invalid = structuredClone(p1Catalog);
    invalid.travelActivities[0].requirements = { inPrison: true, notInPrison: true };

    expect(() => validateP1Catalog(invalid)).toThrow(/Contradictory P1 action requirements/);
  });
});
