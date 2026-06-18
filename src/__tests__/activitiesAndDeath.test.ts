import { catalog } from "../content/catalog";
import type { GameCatalog } from "../content/schema";
import { advanceYear, performActivity } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import { buildDeathSummary } from "../domain/scoring";

describe("activities and death", () => {
  function cloneCatalog(): GameCatalog {
    return structuredClone(catalog);
  }

  function lifeForDeathSummary() {
    const life = generateLife({ seed: "death", catalog });
    return {
      ...life,
      age: 91,
      stats: { happiness: 20, health: 0, smarts: 85, looks: 30 },
      cash: 60_000,
      relationships: life.relationships.map((person, index) => ({
        ...person,
        relationship: index === 0 ? 90 : person.relationship
      })),
      flags: ["kept_wallet"],
      alive: false
    };
  }

  it("performs an available activity", () => {
    const life = { ...generateLife({ seed: "activity", catalog }), age: 10 };
    const result = performActivity({ life, catalog, activityId: "study" });

    expect(result.life.stats.smarts).toBeGreaterThan(life.stats.smarts);
    expect(result.logs[0].messageKey).toBe("log.activity");
  });

  it("throws a useful error for a missing activity", () => {
    const life = { ...generateLife({ seed: "missing-activity", catalog }), age: 10 };

    expect(() => performActivity({ life, catalog, activityId: "missing_activity" })).toThrow(
      "Missing activity missing_activity"
    );
  });

  it("rejects age-locked activities", () => {
    const life = generateLife({ seed: "too-young", catalog });

    expect(() => performActivity({ life, catalog, activityId: "part_time" })).toThrow(
      "Activity part_time is not available"
    );
  });

  it("rejects activities after death", () => {
    const life = { ...generateLife({ seed: "dead-activity", catalog }), age: 10, alive: false };

    expect(() => performActivity({ life, catalog, activityId: "study" })).toThrow(
      "Cannot perform activities after death"
    );
  });

  it("rejects activities while an event is pending", () => {
    const life = { ...generateLife({ seed: "pending-activity", catalog }), age: 10, pendingEventId: "family_picnic" };

    expect(() => performActivity({ life, catalog, activityId: "study" })).toThrow(
      "Resolve pending event before activities"
    );
  });

  it("does not mutate original life when performing an activity", () => {
    const life = { ...generateLife({ seed: "activity-immutability", catalog }), age: 10 };
    const original = structuredClone(life);

    const result = performActivity({ life, catalog, activityId: "study" });

    expect(life).toEqual(original);
    expect(result.life).not.toEqual(original);
  });

  it("creates a deterministic death summary", () => {
    const life = lifeForDeathSummary();
    const summary = buildDeathSummary({ life, catalog, causeOfDeath: "low_health" });

    expect(summary.ageAtDeath).toBe(91);
    expect(summary.causeOfDeath).toBe("low_health");
    expect(summary.summaryKey).toBe("death.summary");
    expect(summary.tags).toEqual(["long_life", "bright", "beloved", "wealthy", "unlucky"]);
    expect(summary.score).toBeGreaterThan(0);
    expect(summary.netWorth).toBe(60_000);
    expect(summary.createdAt).toBe("1970-01-01T00:00:00.000Z");
  });

  it("selects tombstone tags that exist in catalog achievements", () => {
    const life = lifeForDeathSummary();
    const achievementIds = new Set(catalog.achievements.map((achievement) => achievement.id));
    const summary = buildDeathSummary({ life, catalog, causeOfDeath: "old_age" });

    expect(summary.tags.every((tag) => achievementIds.has(tag))).toBe(true);
  });

  it("rejects death summaries when selected tombstone tags are missing from achievements", () => {
    const invalidCatalog = cloneCatalog();
    invalidCatalog.achievements = invalidCatalog.achievements.filter((achievement) => achievement.id !== "bright");
    const life = lifeForDeathSummary();

    expect(() => buildDeathSummary({ life, catalog: invalidCatalog, causeOfDeath: "old_age" })).toThrow(
      "Missing achievement for tombstone tag bright"
    );
  });

  it("sets low-health death details during age-up when health is depleted", () => {
    const life = {
      ...generateLife({ seed: "low-health", catalog }),
      age: 88,
      stats: { happiness: 20, health: 1, smarts: 40, looks: 20 },
      pendingEventId: "family_picnic"
    };
    const result = advanceYear({ life, catalog });

    expect(result.life.alive).toBe(false);
    expect(result.life.death?.causeOfDeath).toBe("low_health");
    expect(result.life.pendingEventId).toBeUndefined();
  });
});
