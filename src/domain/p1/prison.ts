import type { GameCatalog } from "../../content/schema";
import { clampStat } from "../clamp";
import { createRng } from "../rng";
import type { LifeLogEntry, LifeState } from "../types";
import { defaultPrisonState, ensureP1State } from "./defaultState";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

export function canUseNormalActivities(life: LifeState): boolean {
  return !ensureP1State(life).prison.inPrison;
}

export function tickPrison({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  if (!ready.prison.inPrison) return { life: ready, logs: [] as LifeLogEntry[] };
  const remainingYears = Math.max(0, ready.prison.remainingYears - 1);
  if (remainingYears === 0) {
    const next = { ...ready, prison: defaultPrisonState() };
    const entry = log(next, "p1.log.prison.release");
    return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
  }
  const next = {
    ...ready,
    prison: {
      ...ready.prison,
      remainingYears,
      behavior: clampStat(ready.prison.behavior + 1),
      respect: clampStat(ready.prison.respect)
    }
  };
  const entry = log(next, "p1.log.prison.year", { remainingYears });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function paroleAttempt({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  if (!ready.prison.inPrison) throw new Error("prison.not_in_prison");
  const rng = createRng(`${ready.seed}:p1:prison:parole:${ready.age}:${ready.prison.remainingYears}`);
  const approved = ready.prison.behavior + rng.int(0, 30) >= 80;
  const remainingYears = approved ? Math.max(0, ready.prison.remainingYears - 1) : ready.prison.remainingYears;
  const next = {
    ...ready,
    prison: remainingYears === 0 ? defaultPrisonState() : { ...ready.prison, remainingYears, behavior: clampStat(ready.prison.behavior - 5) }
  };
  const entry = log(next, approved ? "p1.log.prison.parole_approved" : "p1.log.prison.parole_denied", { remainingYears });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}
