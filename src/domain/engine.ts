import type { GameCatalog } from "../content/schema";
import { clampRelationship, clampStat } from "./clamp";
import { applyEffect } from "./effects";
import { stageForAge } from "./lifeGenerator";
import { createRng } from "./rng";
import type { LifeLogEntry, LifeState } from "./types";

interface EngineResult {
  life: LifeState;
  logs: LifeLogEntry[];
}

function createLog(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return {
    id: `${life.age}-${messageKey}-${life.log.length + 1}`,
    age: life.age,
    messageKey,
    params
  };
}

export function advanceYear({ life, catalog }: { life: LifeState; catalog: GameCatalog }): EngineResult {
  if (!life.alive) return { life, logs: [] };

  const rng = createRng(`${life.seed}:age:${life.age + 1}`);
  const next: LifeState = structuredClone(life);
  next.age += 1;
  next.stage = stageForAge(next.age);
  next.stats.happiness = clampStat(next.stats.happiness + rng.int(-2, 2));
  next.stats.health = clampStat(next.stats.health + rng.int(-2, 1));
  next.stats.smarts = clampStat(next.stats.smarts + rng.int(0, 1));
  next.stats.looks = clampStat(next.stats.looks + (next.age > 45 ? rng.int(-2, 0) : rng.int(-1, 1)));
  next.relationships = next.relationships.map((person) => ({
    ...person,
    age: person.age + 1,
    relationship: clampRelationship(person.relationship + rng.int(-2, 1))
  }));

  if (!next.pendingEventId) {
    const eligibleEvents = catalog.events.filter((event) => {
      const underMax = event.maxAge === undefined || next.age <= event.maxAge;
      return next.age >= event.minAge && underMax;
    });
    if (eligibleEvents.length > 0) {
      const event = rng.weighted(eligibleEvents.map((item) => ({ value: item, weight: item.weight })));
      next.pendingEventId = event.id;
    }
  }

  const log = createLog(next, "log.age_up", { age: next.age });
  next.log = [...next.log, log];
  return { life: next, logs: [log] };
}

export function resolveEventChoice({
  life,
  catalog,
  choiceId
}: {
  life: LifeState;
  catalog: GameCatalog;
  choiceId: string;
}): EngineResult {
  if (!life.pendingEventId) return { life, logs: [] };
  const event = catalog.events.find((item) => item.id === life.pendingEventId);
  if (!event) throw new Error(`Missing event ${life.pendingEventId}`);
  const choice = event.choices.find((item) => item.id === choiceId);
  if (!choice) throw new Error(`Missing choice ${choiceId} for event ${event.id}`);

  let next = structuredClone(life);
  for (const effect of choice.effects) {
    next = applyEffect(next, effect);
  }
  next.pendingEventId = undefined;
  const log = createLog(next, "log.choice_resolved", { eventId: event.id, choiceId });
  next.log = [...next.log, log];
  return { life: next, logs: [log] };
}
