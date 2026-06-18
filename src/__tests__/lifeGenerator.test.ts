import { catalog } from "../content/catalog";
import { generateLife, stageForAge } from "../domain/lifeGenerator";

describe("generateLife", () => {
  it("creates reproducible randomized lives from the same seed", () => {
    const a = generateLife({ seed: "seed-a", catalog });
    const b = generateLife({ seed: "seed-a", catalog });

    expect(a).toEqual(b);
    expect(a.age).toBe(0);
    expect(a.alive).toBe(true);
  });

  it("keeps randomized stats within playable ranges", () => {
    const life = generateLife({ seed: "seed-b", catalog });

    expect(life.stats.happiness).toBeGreaterThanOrEqual(35);
    expect(life.stats.health).toBeGreaterThanOrEqual(70);
    expect(life.stats.smarts).toBeGreaterThanOrEqual(0);
    expect(life.stats.looks).toBeGreaterThanOrEqual(0);
    expect(life.stats.happiness).toBeLessThanOrEqual(100);
    expect(life.stats.health).toBeLessThanOrEqual(100);
  });

  it("creates parents and zero to three siblings", () => {
    const life = generateLife({ seed: "family-seed", catalog });
    const parents = life.relationships.filter((person) => person.relationType === "parent");
    const siblings = life.relationships.filter((person) => person.relationType === "sibling");

    expect(parents.length).toBeGreaterThanOrEqual(1);
    expect(parents.length).toBeLessThanOrEqual(2);
    expect(siblings.length).toBeGreaterThanOrEqual(0);
    expect(siblings.length).toBeLessThanOrEqual(3);
  });

  it("uses relation type when seeding generated relationships", () => {
    const life = generateLife({ seed: "seed-with-parent-and-sibling", catalog });
    const parent = life.relationships.find((person) => person.relationType === "parent");
    const sibling = life.relationships.find((person) => person.relationType === "sibling");

    expect(parent).toBeDefined();
    expect(sibling).toBeDefined();
    expect({
      name: parent?.name,
      relationship: parent?.relationship,
      traits: parent?.traits
    }).not.toEqual({
      name: sibling?.name,
      relationship: sibling?.relationship,
      traits: sibling?.traits
    });
  });

  it.each([
    [5, "early_childhood"],
    [6, "childhood"],
    [12, "childhood"],
    [13, "teen"],
    [17, "teen"],
    [18, "adult"],
    [64, "adult"],
    [65, "elder"]
  ] as const)("maps age %i to %s", (age, stage) => {
    expect(stageForAge(age)).toBe(stage);
  });

  it("uses birth log message keys that exist in zh-CN locales", () => {
    const life = generateLife({ seed: "birth-log-seed", catalog });

    expect(catalog.locales["zh-CN"][life.log[0].messageKey]).toBeDefined();
  });
});
