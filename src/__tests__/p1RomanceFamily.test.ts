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

  it("adopts a child when the life can pay the fee", () => {
    const life = ensureP1State({ ...generateLife({ seed: "adopt", catalog }), age: 32, cash: 50000 });
    const adopted = adoptChild({ life, catalog }).life;

    expect(adopted.relationships.some((person) => person.relationType === "child")).toBe(true);
    expect(adopted.cash).toBeLessThan(life.cash);
  });
});
