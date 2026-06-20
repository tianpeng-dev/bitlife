import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State, P1_SAVE_VERSION } from "../domain/p1/defaultState";
import { migrateLifeState } from "../storage/migrations";

describe("P1 state migration", () => {
  it("adds every P1 state block to an old life", () => {
    const oldLife = generateLife({ seed: "old-save", catalog });
    const migrated = migrateLifeState(oldLife);

    expect(migrated.saveVersion).toBe(P1_SAVE_VERSION);
    expect(migrated.assets.items).toEqual([]);
    expect(migrated.legal.criminalRecord).toEqual([]);
    expect(migrated.prison.inPrison).toBe(false);
    expect(migrated.fame.score).toBe(0);
    expect(migrated.socialAccounts).toEqual([]);
    expect(migrated.pets).toEqual([]);
    expect(migrated.migrationHistory).toEqual([]);
  });

  it("does not replace existing P1 state", () => {
    const oldLife = ensureP1State(generateLife({ seed: "existing-p1", catalog }));
    const withPet = {
      ...oldLife,
      pets: [
        {
          id: "pet-1",
          catalogId: "p1_pet_cat",
          name: "Mimi",
          age: 2,
          health: 80,
          relationship: 70,
          alive: true
        }
      ]
    };

    expect(migrateLifeState(withPet).pets).toHaveLength(1);
  });
});
