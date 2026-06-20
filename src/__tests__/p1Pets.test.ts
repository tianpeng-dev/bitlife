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
    const otherPet = { ...adopted.pets[0], id: "other-pet", health: 40, relationship: 30 };
    const lifeWithTwoPets = { ...adopted, pets: [adopted.pets[0], otherPet] };
    const cared = careForPet({ life: lifeWithTwoPets, petInstanceId: adopted.pets[0].id });

    expect(cared.life.pets[0].health).toBeGreaterThanOrEqual(adopted.pets[0].health);
    expect(cared.life.pets[0].relationship).toBeGreaterThan(adopted.pets[0].relationship);
    expect(cared.life.pets[1]).toEqual(otherPet);
  });

  it("care rejects missing and dead pets", () => {
    const adopted = adoptPet({
      life: ensureP1State({ ...generateLife({ seed: "pet-care-invalid", catalog }), age: 18, cash: 5000 }),
      catalog,
      petId: "p1_pet_cat"
    }).life;
    const deadPetLife = { ...adopted, pets: [{ ...adopted.pets[0], alive: false }] };

    expect(() => careForPet({ life: adopted, petInstanceId: "missing-pet" })).toThrow("pet.instance_missing:missing-pet");
    expect(() => careForPet({ life: deadPetLife, petInstanceId: adopted.pets[0].id })).toThrow("pet.not_alive");
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

  it("reduces living pet health each tick", () => {
    const adopted = adoptPet({
      life: ensureP1State({ ...generateLife({ seed: "pet-health-tick", catalog }), age: 18, cash: 5000 }),
      catalog,
      petId: "p1_pet_cat"
    }).life;
    const healthyPetLife = { ...adopted, pets: [{ ...adopted.pets[0], age: 1, health: 80, alive: true }] };
    const ticked = tickPets({ life: healthyPetLife, catalog }).life;

    expect(ticked.pets[0]).toMatchObject({
      age: 2,
      alive: true
    });
    expect(ticked.pets[0].health).toBeLessThan(80);
    expect(ticked.pets[0].health).toBeGreaterThanOrEqual(0);
  });

  it("marks a pet dead after its lifespan", () => {
    const adopted = adoptPet({
      life: ensureP1State({ ...generateLife({ seed: "pet-lifespan", catalog }), age: 18, cash: 5000 }),
      catalog,
      petId: "p1_pet_cat"
    }).life;
    const lifespan = catalog.p1.pets.find((pet) => pet.id === "p1_pet_cat")!.lifespan;
    const agingPetLife = { ...adopted, pets: [{ ...adopted.pets[0], age: lifespan - 1 }] };
    const ticked = tickPets({ life: agingPetLife, catalog }).life;

    expect(ticked.pets[0].age).toBe(lifespan);
    expect(ticked.pets[0].alive).toBe(false);
    expect(ticked.pets[0].health).toBe(0);
  });

  it("marks a pet dead when health reaches zero", () => {
    const adopted = adoptPet({
      life: ensureP1State({ ...generateLife({ seed: "pet-health-zero", catalog }), age: 18, cash: 5000 }),
      catalog,
      petId: "p1_pet_cat"
    }).life;
    const fragilePetLife = { ...adopted, pets: [{ ...adopted.pets[0], age: 1, health: 3, alive: true }] };
    const ticked = tickPets({ life: fragilePetLife, catalog }).life;

    expect(ticked.pets[0]).toMatchObject({
      alive: false,
      health: 0
    });
  });

  it("keeps dead pets dead with zero health on later ticks", () => {
    const adopted = adoptPet({
      life: ensureP1State({ ...generateLife({ seed: "pet-dead-stays-dead", catalog }), age: 18, cash: 5000 }),
      catalog,
      petId: "p1_pet_cat"
    }).life;
    const deadPetLife = { ...adopted, pets: [{ ...adopted.pets[0], alive: false, health: 40 }] };
    const ticked = tickPets({ life: deadPetLife, catalog }).life;

    expect(ticked.pets[0]).toMatchObject({
      alive: false,
      health: 0
    });
  });
});
