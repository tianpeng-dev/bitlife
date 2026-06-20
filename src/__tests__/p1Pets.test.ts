import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";
import { adoptPet, careForPet, tickPets } from "../domain/p1/pets";

describe("P1 pets", () => {
  it("adopts a pet and charges cash", () => {
    const life = ensureP1State({ ...generateLife({ seed: "pet", catalog }), age: 18, cash: 5000 });
    const result = adoptPet({ life, catalog, petId: "p1_pet_cat" });

    expect(result.life.pets).toHaveLength(1);
    expect(result.life.cash).toBeLessThan(life.cash);
  });

  it("care improves pet health and relationship", () => {
    const adopted = adoptPet({
      life: ensureP1State({ ...generateLife({ seed: "pet-care", catalog }), age: 18, cash: 5000 }),
      catalog,
      petId: "p1_pet_cat"
    }).life;
    const cared = careForPet({ life: adopted, petInstanceId: adopted.pets[0].id });

    expect(cared.life.pets[0].health).toBeGreaterThanOrEqual(adopted.pets[0].health);
    expect(cared.life.pets[0].relationship).toBeGreaterThan(adopted.pets[0].relationship);
  });

  it("ticks pet age", () => {
    const adopted = adoptPet({
      life: ensureP1State({ ...generateLife({ seed: "pet-tick", catalog }), age: 18, cash: 5000 }),
      catalog,
      petId: "p1_pet_cat"
    }).life;
    const ticked = tickPets({ life: adopted, catalog }).life;

    expect(ticked.pets[0].age).toBe(adopted.pets[0].age + 1);
  });
});
