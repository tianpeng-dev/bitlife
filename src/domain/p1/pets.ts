import type { GameCatalog } from "../../content/schema";
import { clampRelationship, clampStat } from "../clamp";
import { createRng } from "../rng";
import type { LifeLogEntry, LifeState, PetState } from "../types";
import { ensureP1State } from "./defaultState";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

export function adoptPet({ life, catalog, petId }: { life: LifeState; catalog: GameCatalog; petId: string }) {
  const ready = ensureP1State(life);
  const config = catalog.p1.pets.find((pet) => pet.id === petId);
  if (!config) throw new Error(`pet.missing:${petId}`);

  const rng = createRng(`${ready.seed}:p1:pet:adopt:${petId}:${ready.age}:${ready.pets.length}`);
  const price = rng.int(config.minPrice, config.maxPrice);
  if (ready.cash < price) throw new Error("activity.cash_too_low");

  const pet: PetState = {
    id: `pet-${ready.age}-${petId}-${rng.int(1000, 9999)}`,
    catalogId: config.id,
    name: config.nameKey,
    age: rng.int(0, Math.min(2, config.lifespan - 1)),
    health: clampStat(rng.int(65, 100)),
    relationship: clampRelationship(rng.int(20, 55)),
    alive: true
  };
  const next = { ...ready, cash: ready.cash - price, pets: [...ready.pets, pet] };
  const entry = log(next, "p1.log.pet.adopt", { petId, price });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function careForPet({ life, petInstanceId }: { life: LifeState; petInstanceId: string }) {
  const ready = ensureP1State(life);
  const pet = ready.pets.find((candidate) => candidate.id === petInstanceId);
  if (!pet) throw new Error(`pet.instance_missing:${petInstanceId}`);
  if (!pet.alive) throw new Error("pet.not_alive");

  const pets = ready.pets.map((candidate) =>
    candidate.id === petInstanceId
      ? {
          ...candidate,
          health: clampStat(candidate.health + 8),
          relationship: clampRelationship(candidate.relationship + 12)
        }
      : candidate
  );
  const next = { ...ready, pets };
  const entry = log(next, "p1.log.pet.care", { petId: pet.catalogId });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function tickPets({ life, catalog }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  const pets = ready.pets.map((pet) => {
    if (!pet.alive) return pet;
    const config = catalog.p1.pets.find((candidate) => candidate.id === pet.catalogId);
    const age = pet.age + 1;
    const alive = config ? age <= config.lifespan : pet.alive;
    return { ...pet, age, alive };
  });
  return { life: { ...ready, pets }, logs: [] as LifeLogEntry[] };
}
