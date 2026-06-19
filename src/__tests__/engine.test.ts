import { catalog } from "../content/catalog";
import type { GameCatalog } from "../content/schema";
import { applyEffect } from "../domain/effects";
import { advanceYear, performActivity, resolveEventChoice } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";

describe("engine", () => {
  function cloneCatalog(): GameCatalog {
    return structuredClone(catalog);
  }

  it("advances age by one and keeps stats bounded", () => {
    const life = generateLife({ seed: "age-up", catalog });
    const result = advanceYear({ life, catalog });

    expect(result.life.age).toBe(1);
    expect(result.life.stats.health).toBeGreaterThanOrEqual(0);
    expect(result.life.stats.health).toBeLessThanOrEqual(100);
    expect(result.logs.length).toBeGreaterThanOrEqual(1);
  });

  it("can resolve a pending event choice", () => {
    const life = { ...generateLife({ seed: "event-choice", catalog }), pendingEventId: "family_picnic" };
    const result = resolveEventChoice({ life, catalog, choiceId: "join" });

    expect(result.life.pendingEventId).toBeUndefined();
    expect(result.logs.some((entry) => entry.messageKey === "log.choice_resolved")).toBe(true);
  });

  it("settles death immediately when an event choice depletes health", () => {
    const life = {
      ...generateLife({ seed: "choice-death", catalog }),
      age: 18,
      stats: { happiness: 50, health: 1, smarts: 50, looks: 50 },
      pendingEventId: "burnout_warning"
    };

    const result = resolveEventChoice({ life, catalog, choiceId: "push" });

    expect(result.life.alive).toBe(false);
    expect(result.life.pendingEventId).toBeUndefined();
    expect(result.life.death?.causeOfDeath).toBe("low_health");
  });

  it("applies effects with bounded stats, cash, relationships, diseases, and flags", () => {
    const life = generateLife({ seed: "apply-effect", catalog });
    const baseRelationship = life.relationships[0].relationship;
    const result = applyEffect(
      {
        ...life,
        stats: { happiness: 99, health: 1, smarts: 50, looks: 50 },
        cash: 25,
        relationships: [{ ...life.relationships[0], relationship: baseRelationship }],
        diseases: [{ id: "cold", severity: 10, diagnosed: false, yearsActive: 0 }],
        flags: ["careful"]
      },
      {
        stats: { happiness: 10, health: -10, smarts: 2 },
        cash: 75,
        relationship: 90,
        addDiseaseId: "cold",
        addFlag: "careful"
      }
    );

    expect(result.stats.happiness).toBe(100);
    expect(result.stats.health).toBe(0);
    expect(result.stats.smarts).toBe(52);
    expect(result.cash).toBe(100);
    expect(result.relationships[0].relationship).toBe(100);
    expect(result.diseases.filter((disease) => disease.id === "cold")).toHaveLength(1);
    expect(result.flags.filter((flag) => flag === "careful")).toHaveLength(1);
  });

  it("does not age a dead life", () => {
    const life = { ...generateLife({ seed: "dead-life", catalog }), alive: false };
    const result = advanceYear({ life, catalog });

    expect(result.life).toBe(life);
    expect(result.logs).toEqual([]);
  });

  it("ages without a pending event when no events are eligible", () => {
    const sparseCatalog = cloneCatalog();
    sparseCatalog.events = sparseCatalog.events.map((event) => ({ ...event, minAge: 99 }));
    const life = generateLife({ seed: "no-event", catalog: sparseCatalog });

    const result = advanceYear({ life, catalog: sparseCatalog });

    expect(result.life.age).toBe(1);
    expect(result.life.pendingEventId).toBeUndefined();
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].messageKey).toBe("log.age_up");
  });

  it("keeps an existing pending event when aging", () => {
    const life = { ...generateLife({ seed: "existing-event", catalog }), pendingEventId: "family_picnic" };

    const result = advanceYear({ life, catalog });

    expect(result.life.age).toBe(1);
    expect(result.life.pendingEventId).toBe("family_picnic");
  });

  it("does not present event choices before age six", () => {
    let life = generateLife({ seed: "early-choice-gate", catalog });

    for (let age = 1; age <= 5; age += 1) {
      life = advanceYear({ life, catalog }).life;
      expect(life.age).toBe(age);
      expect(life.pendingEventId).toBeUndefined();
    }

    const result = advanceYear({ life, catalog });

    expect(result.life.age).toBe(6);
    expect(result.life.pendingEventId).toBeDefined();
  });

  it("progresses education and career during age-up", () => {
    let life = { ...generateLife({ seed: "career-progress", catalog }), age: 17, stats: { happiness: 80, health: 80, smarts: 95, looks: 70 } };

    const adult = advanceYear({ life, catalog }).life;

    expect(adult.education.stage).toBe("university");
    expect(adult.career.careerId).toBeDefined();
    expect(adult.career.salary).toBeGreaterThan(0);

    life = { ...adult, pendingEventId: undefined };
    const nextYear = advanceYear({ life, catalog }).life;

    expect(nextYear.career.years).toBe(adult.career.years + 1);
  });

  it("progresses diseases and lets care activities treat them", () => {
    const life = {
      ...generateLife({ seed: "disease-progress", catalog }),
      age: 20,
      pendingEventId: undefined,
      stats: { happiness: 50, health: 60, smarts: 50, looks: 50 },
      diseases: [{ id: "flu", severity: 10, diagnosed: false, yearsActive: 0 }]
    };

    const aged = advanceYear({ life, catalog }).life;

    expect(aged.diseases[0].diagnosed).toBe(true);
    expect(aged.diseases[0].yearsActive).toBe(1);
    expect(aged.diseases[0].severity).toBeGreaterThan(10);
    expect(aged.stats.health).toBeLessThanOrEqual(60);

    const treated = performActivity({ life: { ...aged, pendingEventId: undefined }, catalog, activityId: "doctor" }).life;

    expect(treated.diseases.length).toBeLessThanOrEqual(aged.diseases.length);
    if (treated.diseases[0]) {
      expect(treated.diseases[0].severity).toBeLessThan(aged.diseases[0].severity);
    }
  });

  it("does not mutate original life when resolving an event choice", () => {
    const life = { ...generateLife({ seed: "immutability", catalog }), pendingEventId: "family_picnic" };
    const original = structuredClone(life);

    const result = resolveEventChoice({ life, catalog, choiceId: "join" });

    expect(life).toEqual(original);
    expect(result.life).not.toEqual(original);
  });

  it("throws a useful error for an invalid pending event", () => {
    const life = { ...generateLife({ seed: "missing-event", catalog }), pendingEventId: "missing_event" };

    expect(() => resolveEventChoice({ life, catalog, choiceId: "join" })).toThrow(/Missing event missing_event/);
  });

  it("throws a useful error for an invalid event choice", () => {
    const life = { ...generateLife({ seed: "missing-choice", catalog }), pendingEventId: "family_picnic" };

    expect(() => resolveEventChoice({ life, catalog, choiceId: "missing_choice" })).toThrow(
      /Missing choice missing_choice for event family_picnic/
    );
  });
});
