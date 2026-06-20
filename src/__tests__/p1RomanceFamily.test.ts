import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";
import { adoptChild, proposeMarriage, startDating, startPregnancy, tickRomanceFamily } from "../domain/p1/romanceFamily";

describe("P1 romance and family", () => {
  it("creates a lover and can turn them into a spouse", () => {
    const life = ensureP1State({ ...generateLife({ seed: "romance", catalog }), age: 25, cash: 10000 });
    const dating = startDating({ life, catalog }).life;
    const married = proposeMarriage({ life: dating, catalog }).life;

    expect(dating.relationships.some((person) => person.relationType === "lover")).toBe(true);
    expect(married.relationships.some((person) => person.relationType === "spouse")).toBe(true);
  });

  it("startDating rejects when already partnered", () => {
    const life = ensureP1State({ ...generateLife({ seed: "partnered", catalog }), age: 25, cash: 10000 });
    const dating = startDating({ life, catalog }).life;

    expect(() => startDating({ life: dating, catalog })).toThrow("relationship.partner_exists");
  });

  it("keeps one spouse and clears other active lovers on marriage", () => {
    const life = ensureP1State({ ...generateLife({ seed: "multiple-lovers", catalog }), age: 30, cash: 10000 });
    const dating = startDating({ life, catalog }).life;
    const selectedLover = dating.relationships.find((person) => person.relationType === "lover");
    expect(selectedLover).toBeDefined();
    const extraLover = {
      ...selectedLover!,
      id: "imported-extra-lover",
      name: "Imported Lover",
      relationship: 70
    };
    const importedState = { ...dating, relationships: [...dating.relationships, extraLover] };
    const married = proposeMarriage({ life: importedState, catalog }).life;

    expect(married.relationships.find((person) => person.id === selectedLover!.id)?.relationType).toBe("spouse");
    expect(married.relationships.find((person) => person.id === "imported-extra-lover")).toMatchObject({
      relationType: "friend",
      relationship: 60
    });
    expect(married.relationships.some((person) => person.alive && person.relationType === "lover")).toBe(false);
  });

  it("rejects marriage when migrated state already has an active spouse and lover", () => {
    const life = ensureP1State({ ...generateLife({ seed: "active-spouse-and-lover", catalog }), age: 30, cash: 10000 });
    const dating = startDating({ life, catalog }).life;
    const lover = dating.relationships.find((person) => person.relationType === "lover");
    expect(lover).toBeDefined();
    const spouse = {
      ...lover!,
      id: "imported-active-spouse",
      name: "Imported Spouse",
      relationType: "spouse" as const,
      relationship: 80
    };
    const importedState = { ...dating, relationships: [spouse, ...dating.relationships] };

    expect(() => proposeMarriage({ life: importedState, catalog })).toThrow("romance.already_married");
    expect(importedState.relationships.filter((person) => person.alive && person.relationType === "spouse")).toHaveLength(1);
  });

  it("can progress pregnancy into a child relationship", () => {
    const married = proposeMarriage({
      life: startDating({ life: ensureP1State({ ...generateLife({ seed: "baby", catalog }), age: 28, cash: 10000 }), catalog }).life,
      catalog
    }).life;
    let pregnant = startPregnancy({ life: married, catalog }).life;

    for (let index = 0; index < 2; index += 1) {
      pregnant = tickRomanceFamily({ life: { ...pregnant, age: pregnant.age + 1 }, catalog }).life;
    }

    expect(pregnant.relationships.some((person) => person.relationType === "child")).toBe(true);
  });

  it("startPregnancy rejects when already pregnant", () => {
    const married = proposeMarriage({
      life: startDating({ life: ensureP1State({ ...generateLife({ seed: "pregnant-again", catalog }), age: 28, cash: 10000 }), catalog }).life,
      catalog
    }).life;
    const pregnant = startPregnancy({ life: married, catalog }).life;

    expect(() => startPregnancy({ life: pregnant, catalog })).toThrow("family.already_pregnant");
  });

  it("clears pregnancy flags after birth and does not create another child on a second tick", () => {
    const married = proposeMarriage({
      life: startDating({ life: ensureP1State({ ...generateLife({ seed: "birth-once", catalog }), age: 28, cash: 10000 }), catalog }).life,
      catalog
    }).life;
    const pregnant = startPregnancy({ life: married, catalog }).life;
    const afterBirth = tickRomanceFamily({ life: { ...pregnant, age: pregnant.age + 1 }, catalog }).life;
    const secondTick = tickRomanceFamily({ life: { ...afterBirth, age: afterBirth.age + 1 }, catalog }).life;

    expect(afterBirth.flags).not.toContain("p1_pregnant");
    expect(afterBirth.flags.some((flag) => flag.startsWith("p1_pregnancy_started_age_"))).toBe(false);
    expect(afterBirth.relationships.filter((person) => person.relationType === "child")).toHaveLength(1);
    expect(secondTick.relationships.filter((person) => person.relationType === "child")).toHaveLength(1);
  });

  it("adopts a child when the life can pay the fee", () => {
    const life = ensureP1State({ ...generateLife({ seed: "adopt", catalog }), age: 32, cash: 50000 });
    const adopted = adoptChild({ life, catalog }).life;

    expect(adopted.relationships.some((person) => person.relationType === "child")).toBe(true);
    expect(adopted.cash).toBeLessThan(life.cash);
  });
});
