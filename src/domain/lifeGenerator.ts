import type { GameCatalog } from "../content/schema";
import { clampRelationship, clampStat } from "./clamp";
import { createRng } from "./rng";
import type { Gender, LifeStage, LifeState, Person } from "./types";

const firstNames = ["林小雨", "陈安", "周可", "Alex", "Mia", "Sam"];
const lastNames = ["李", "王", "Taylor", "Chen", "Garcia", "Smith"];
const traits = ["kind", "strict", "generous", "dramatic", "quiet", "chaotic"];

function stageForAge(age: number): LifeStage {
  if (age <= 5) return "early_childhood";
  if (age <= 12) return "childhood";
  if (age <= 17) return "teen";
  if (age <= 64) return "adult";
  return "elder";
}

function createPerson(seed: string, index: number, relationType: Person["relationType"], age: number): Person {
  const rng = createRng(`${seed}:person:${relationType}:${index}`);
  return {
    id: `${relationType}-${index}`,
    name: `${rng.pick(lastNames)}${rng.pick(firstNames)}`,
    age,
    relationType,
    relationship: clampRelationship(rng.int(35, 95)),
    traits: [rng.pick(traits)],
    alive: true
  };
}

export function generateLife({ seed, catalog }: { seed: string; catalog: GameCatalog }): LifeState {
  const rng = createRng(seed);
  const country = rng.pick(catalog.countries);
  const gender = rng.pick<Gender>(["female", "male", "nonbinary"]);
  const parentCount = rng.int(1, 2);
  const siblingCount = rng.int(0, 3);
  const relationships: Person[] = [];

  for (let i = 0; i < parentCount; i += 1) {
    relationships.push(createPerson(seed, i, "parent", rng.int(22, 45)));
  }
  for (let i = 0; i < siblingCount; i += 1) {
    relationships.push(createPerson(seed, i, "sibling", rng.int(0, 8)));
  }

  return {
    id: `life-${seed}`,
    seed,
    name: `${rng.pick(lastNames)}${rng.pick(firstNames)}`,
    gender,
    age: 0,
    stage: stageForAge(0),
    countryId: country.id,
    city: rng.pick(country.cities),
    alive: true,
    stats: {
      happiness: clampStat(rng.int(35, 100)),
      health: clampStat(rng.int(70, 100)),
      smarts: clampStat(rng.int(0, 100)),
      looks: clampStat(rng.int(0, 100))
    },
    cash: rng.int(0, 2000),
    relationships,
    education: { stage: "none", yearsCompleted: 0 },
    career: { salary: 0, performance: 0, years: 0 },
    diseases: [],
    flags: [],
    freeActivitiesCompletedThisYear: [],
    log: [
      {
        id: "birth",
        age: 0,
        messageKey: "log.birth",
        params: { countryId: country.id }
      }
    ]
  };
}

export { stageForAge };
