import { catalog } from "../content/catalog";
import { advanceYear, performActivity } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import { availableP1Activities } from "../domain/p1/activityCatalog";
import { buyAsset } from "../domain/p1/assets";
import { ensureP1State } from "../domain/p1/defaultState";
import { contentLabel } from "../i18n";

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

  it("dispatches enabled generated asset cards through performActivity", () => {
    const life = ensureP1State({
      ...generateLife({ seed: "p1-engine-dispatch-generated-asset", catalog }),
      age: 18,
      cash: 200000
    });
    const card = availableP1Activities(life, catalog).find((activity) => activity.id === "p1_asset_buy_used_hatchback");

    expect(card).toMatchObject({ disabled: false });

    const result = performActivity({ life, catalog, activityId: card!.id });
    const dispatched = ensureP1State(result.life);

    expect(dispatched.assets.items).toHaveLength(1);
    expect(dispatched.assets.items[0].catalogId).toBe("used_hatchback");
    expect(result.logs[0].messageKey).toBe("p1.log.asset.buy");
  });

  it("dispatches enabled generated pet cards through performActivity", () => {
    const life = ensureP1State({
      ...generateLife({ seed: "p1-engine-dispatch-generated-pet", catalog }),
      age: 18,
      cash: 5000
    });
    const card = availableP1Activities(life, catalog).find((activity) => activity.id === "p1_pet_adopt_p1_pet_cat");

    expect(card).toMatchObject({ disabled: false });

    const result = performActivity({ life, catalog, activityId: card!.id });
    const dispatched = ensureP1State(result.life);

    expect(dispatched.pets).toHaveLength(1);
    expect(dispatched.pets[0].catalogId).toBe("p1_pet_cat");
    expect(result.logs[0].messageKey).toBe("p1.log.pet.adopt");
  });

  it("dispatches enabled generated crime cards through performActivity", () => {
    const life = ensureP1State({
      ...generateLife({ seed: "p1-engine-dispatch-generated-crime", catalog }),
      age: 18,
      cash: 5000
    });
    const card = availableP1Activities(life, catalog).find((activity) => activity.id === "p1_crime_shoplifting");

    expect(card).toMatchObject({ disabled: false });

    const result = performActivity({ life, catalog, activityId: card!.id });

    expect(result.logs[0].messageKey).toMatch(/^p1\.log\.crime\./);
  });

  it("dispatches every P1 public activity system without missing-activity errors", () => {
    const base = ensureP1State({
      ...generateLife({ seed: "p1-engine-dispatch-all-systems", catalog }),
      age: 30,
      cash: 50_000,
      countryId: "us",
      fame: { source: "test", score: 50, publicSentiment: 50 }
    });

    expect(() => performActivity({ life: base, catalog, activityId: "p1_travel_vacation" })).not.toThrow(/p1\.activity_missing/);
    expect(() => performActivity({ life: base, catalog, activityId: "p1_fame_interview" })).not.toThrow(/p1\.activity_missing/);
    expect(() => performActivity({ life: base, catalog, activityId: "p1_social_create_p1_social_short_video" })).not.toThrow(/p1\.activity_missing/);
    expect(() => performActivity({ life: base, catalog, activityId: "p1_romance_date" })).not.toThrow(/p1\.activity_missing/);
    expect(() => performActivity({ life: base, catalog, activityId: "p1_family_adopt" })).not.toThrow(/p1\.activity_missing/);

    const prisoner = {
      ...base,
      prison: {
        inPrison: true,
        sentenceYears: 3,
        remainingYears: 2,
        securityLevel: "minimum" as const,
        behavior: 90,
        respect: 20
      }
    };
    expect(() => performActivity({ life: prisoner, catalog, activityId: "p1_prison_parole" })).not.toThrow(/p1\.activity_missing/);
  });

  it("dispatches enabled travel and migration cards at their advertised cost", () => {
    const base = ensureP1State({
      ...generateLife({ seed: "p1-engine-dispatch-travel-costs", catalog }),
      age: 30,
      cash: 50_000,
      countryId: "us"
    });
    const travelCards = availableP1Activities(base, catalog).filter((activity) => activity.group === "travel_migration");

    expect(travelCards.length).toBeGreaterThan(0);
    for (const card of travelCards) {
      const life = { ...base, cash: card.cost ?? 0 };

      expect(card.disabled).toBe(false);
      expect(() => performActivity({ life, catalog, activityId: card.id })).not.toThrow(/activity\.cash_too_low/);
    }
  });

  it("localizes reachable P1 log keys", () => {
    expect(contentLabel("zh-CN", "p1.log.asset.buy")).not.toBe("p1.log.asset.buy");
    expect(contentLabel("zh-CN", "p1.log.crime.success")).not.toBe("p1.log.crime.success");
    expect(contentLabel("zh-CN", "p1.log.pet.adopt")).not.toBe("p1.log.pet.adopt");
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

  it("does not run P1 prison ticks after a fatal butterfly consequence", () => {
    const life = ensureP1State({
      ...generateLife({ seed: "p1-engine-fatal-prison-tick", catalog }),
      alive: true,
      age: 30,
      pendingEventId: undefined,
      prison: {
        inPrison: true,
        sentenceYears: 5,
        remainingYears: 3,
        securityLevel: "minimum",
        behavior: 50,
        respect: 20
      },
      pendingConsequences: [
        {
          id: "fatal-while-imprisoned",
          source: "activity",
          originId: "night_out",
          choiceId: "reckless",
          triggerAge: 31,
          outcome: "fatal_accident",
          intensity: 5
        }
      ]
    });

    const result = advanceYear({ life, catalog });

    expect(result.life.alive).toBe(false);
    expect(result.logs.map((entry) => entry.messageKey)).not.toContain("p1.log.prison.year");
    expect(ensureP1State(result.life).prison.remainingYears).toBe(3);
  });
});
