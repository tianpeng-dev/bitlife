import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";
import {
  adoptChild,
  divorcePartner,
  proposeMarriage,
  startDating,
  startPregnancy,
  tickRomanceFamily
} from "../domain/p1/romanceFamily";

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

  it("startDating rejects when under age 16", () => {
    const life = ensureP1State({ ...generateLife({ seed: "too-young-date", catalog }), age: 15, cash: 10000 });

    expect(() => startDating({ life, catalog })).toThrow("activity.too_young");
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

  it("divorces an active spouse into a friend and charges cash", () => {
    const life = ensureP1State({ ...generateLife({ seed: "divorce", catalog }), age: 30, cash: 10000 });
    const married = proposeMarriage({ life: startDating({ life, catalog }).life, catalog }).life;
    const spouse = married.relationships.find((person) => person.relationType === "spouse");
    expect(spouse).toBeDefined();

    const result = divorcePartner({ life: married, catalog });
    const formerSpouse = result.life.relationships.find((person) => person.id === spouse!.id);

    expect(formerSpouse).toMatchObject({
      relationType: "friend",
      relationship: spouse!.relationship - 25
    });
    expect(result.life.cash).toBe(married.cash - 2500);
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0]).toMatchObject({
      messageKey: "p1.log.romance.divorce",
      params: { partnerName: spouse!.name, cost: 2500 }
    });
  });

  it("divorcePartner rejects when no spouse exists", () => {
    const life = ensureP1State({ ...generateLife({ seed: "divorce-no-spouse", catalog }), age: 30, cash: 10000 });

    expect(() => divorcePartner({ life, catalog })).toThrow("romance.no_spouse");
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
