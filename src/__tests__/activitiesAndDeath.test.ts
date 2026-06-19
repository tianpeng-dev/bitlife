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
    expect(result.life.freeActivitiesCompletedThisYear).toContain("study");
    expect(result.logs[0].messageKey).toBe("log.activity");
  });

  it("rejects repeating the same free activity in one year", () => {
    const life = { ...generateLife({ seed: "repeat-free", catalog }), age: 10 };
    const result = performActivity({ life, catalog, activityId: "study" });

    expect(() => performActivity({ life: result.life, catalog, activityId: "study" })).toThrow(
      "Activity study was already completed this year"
    );
  });

  it("allows the same free activity again after aging up", () => {
    const life = { ...generateLife({ seed: "repeat-next-year", catalog }), age: 10, pendingEventId: undefined };
    const activityResult = performActivity({ life, catalog, activityId: "study" });
    const ageResult = advanceYear({ life: activityResult.life, catalog });

    expect(ageResult.life.freeActivitiesCompletedThisYear).toEqual([]);
    expect(() => performActivity({ life: ageResult.life, catalog, activityId: "study" })).not.toThrow();
  });

  it("allows paid activities to repeat in one year", () => {
    const life = { ...generateLife({ seed: "repeat-paid", catalog }), age: 10, cash: 1000 };
    const firstResult = performActivity({ life, catalog, activityId: "read_book" });

    expect(() => performActivity({ life: firstResult.life, catalog, activityId: "read_book" })).not.toThrow();
    expect(firstResult.life.freeActivitiesCompletedThisYear).toEqual([]);
  });

  it("allows skipping school during university age", () => {
    const life = { ...generateLife({ seed: "university-skip", catalog }), age: 19, pendingEventId: undefined };

    const result = performActivity({ life, catalog, activityId: "skip_school" });

    expect(result.life.flags).toContain("skipped_school");
    expect(result.life.freeActivitiesCompletedThisYear).toContain("skip_school");
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

  it("allows activities while an event is pending", () => {
    const life = { ...generateLife({ seed: "pending-activity", catalog }), age: 10, pendingEventId: "family_picnic" };

    const result = performActivity({ life, catalog, activityId: "study" });

    expect(result.life.pendingEventId).toBe("family_picnic");
    expect(result.life.stats.smarts).toBeGreaterThan(life.stats.smarts);
  });

  it("does not mutate original life when performing an activity", () => {
    const life = { ...generateLife({ seed: "activity-immutability", catalog }), age: 10 };
    const original = structuredClone(life);

    const result = performActivity({ life, catalog, activityId: "study" });

    expect(life).toEqual(original);
    expect(result.life).not.toEqual(original);
  });

  it("sets low-health death details when an activity depletes health", () => {
    const life = {
      ...generateLife({ seed: "activity-death", catalog }),
      age: 18,
      pendingEventId: undefined,
      stats: { happiness: 50, health: 1, smarts: 50, looks: 50 }
    };

    const result = performActivity({ life, catalog, activityId: "night_out" });

    expect(result.life.alive).toBe(false);
    expect(result.life.death?.causeOfDeath).toBe("low_health");
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
