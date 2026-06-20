import type { GameCatalog } from "../../content/schema";
import { clampRelationship } from "../clamp";
import { createRng } from "../rng";
import type { LifeLogEntry, LifeState, Person, RelationshipType } from "../types";
import { activityDeniedByLaw } from "./countriesLaw";
import { ensureP1State } from "./defaultState";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

function newPerson(life: LifeState, relationType: RelationshipType, age: number): Person {
  const rng = createRng(`${life.seed}:p1:person:${relationType}:${life.age}:${life.relationships.length}`);
  const names = ["Alex", "Sam", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Jamie"];
  return {
    id: `person-${relationType}-${life.age}-${rng.int(1000, 9999)}`,
    name: rng.pick(names),
    age,
    relationType,
    relationship: clampRelationship(rng.int(45, 85)),
    traits: [],
    alive: true
  };
}

function pregnancyStartedAge(flags: string[]): number | undefined {
  const started = flags.find((flag) => flag.startsWith("p1_pregnancy_started_age_"));
  if (!started) return undefined;
  const age = Number(started.replace("p1_pregnancy_started_age_", ""));
  return Number.isFinite(age) ? age : undefined;
}

function withoutPregnancyFlags(flags: string[]): string[] {
  return flags.filter((flag) => flag !== "p1_pregnant" && !flag.startsWith("p1_pregnancy_started_age_"));
}

export function startDating({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  if (ready.relationships.some((person) => person.alive && (person.relationType === "lover" || person.relationType === "spouse"))) {
    return { life: ready, logs: [] as LifeLogEntry[] };
  }

  const partnerAge = Math.max(ready.age - 2, 13);
  const lover = newPerson(ready, "lover", partnerAge);
  const next = { ...ready, relationships: [...ready.relationships, lover] };
  const entry = log(next, "p1.log.romance.dating", { personId: lover.id });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function proposeMarriage({ life, catalog }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  const denial = activityDeniedByLaw(ready, catalog, { law: "marriage" });
  if (denial) throw new Error(denial);

  const lover = ready.relationships.find((person) => person.alive && person.relationType === "lover");
  if (!lover) throw new Error("relationship.lover_missing");

  const cost = Math.min(1000, Math.max(0, ready.cash));
  const relationships = ready.relationships.map((person) =>
    person.id === lover.id ? { ...person, relationType: "spouse" as const, relationship: clampRelationship(person.relationship + 10) } : person
  );
  const next = { ...ready, cash: ready.cash - cost, relationships };
  const entry = log(next, "p1.log.romance.marriage", { personId: lover.id, cost });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function startPregnancy({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  if (!ready.relationships.some((person) => person.alive && person.relationType === "spouse")) {
    throw new Error("relationship.spouse_missing");
  }
  if (ready.flags.includes("p1_pregnant")) return { life: ready, logs: [] as LifeLogEntry[] };

  const flags = [...withoutPregnancyFlags(ready.flags), "p1_pregnant", `p1_pregnancy_started_age_${ready.age}`];
  const next = { ...ready, flags };
  const entry = log(next, "p1.log.family.pregnancy_start");
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function adoptChild({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  if (ready.age < 21) throw new Error("activity.too_young");
  if (ready.cash < 5000) throw new Error("activity.cash_too_low");

  const child = newPerson(ready, "child", 0);
  const next = { ...ready, cash: ready.cash - 5000, relationships: [...ready.relationships, child] };
  const entry = log(next, "p1.log.family.adopt", { personId: child.id, cost: 5000 });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function tickRomanceFamily({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  if (!ready.flags.includes("p1_pregnant")) return { life: ready, logs: [] as LifeLogEntry[] };

  const startedAge = pregnancyStartedAge(ready.flags);
  if (startedAge === undefined || ready.age - startedAge < 1) {
    return { life: ready, logs: [] as LifeLogEntry[] };
  }

  const child = newPerson(ready, "child", 0);
  const next = {
    ...ready,
    flags: withoutPregnancyFlags(ready.flags),
    relationships: [...ready.relationships, child]
  };
  const entry = log(next, "p1.log.family.birth", { personId: child.id });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}
