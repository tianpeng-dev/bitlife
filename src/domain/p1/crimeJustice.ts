import type { GameCatalog } from "../../content/schema";
import { createRng } from "../rng";
import type { LegalRecordEntry, LifeLogEntry, LifeState } from "../types";
import { sentenceYearsForCrime } from "./countriesLaw";
import { ensureP1State } from "./defaultState";

type ForcedCrimeOutcome = "success" | "fail" | "arrest";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

export function attemptCrime({
  life,
  catalog,
  crimeId,
  forceOutcome
}: {
  life: LifeState;
  catalog: GameCatalog;
  crimeId: string;
  forceOutcome?: ForcedCrimeOutcome;
}) {
  const ready = ensureP1State(life);
  if (ready.prison.inPrison) throw new Error("crime.in_prison");
  const crime = catalog.p1.crimes.find((item) => item.id === crimeId);
  if (!crime) throw new Error(`crime.missing:${crimeId}`);
  if (ready.age < (crime.requirements.minAge ?? 0)) throw new Error("activity.too_young");

  const rng = createRng(`${ready.seed}:p1:crime:${crimeId}:${ready.age}:${ready.legal.criminalRecord.length}`);
  const roll = rng.next();
  const outcome = forceOutcome ?? (roll <= crime.baseSuccess ? "success" : roll <= crime.baseSuccess + crime.baseArrest ? "arrest" : "fail");

  if (outcome === "success") {
    const reward = rng.int(crime.minReward, crime.maxReward);
    const next = { ...ready, cash: ready.cash + reward };
    const entry = log(next, "p1.log.crime.success", { crimeId, reward });
    return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
  }

  if (outcome === "arrest") {
    const sentenceYears = sentenceYearsForCrime(ready, catalog, crime.severity);
    const record: LegalRecordEntry = {
      id: `record-${ready.age}-${crimeId}-${rng.int(1000, 9999)}`,
      crimeId,
      age: ready.age,
      convicted: true,
      sentenceYears
    };
    const next = {
      ...ready,
      legal: { ...ready.legal, wantedLevel: 0, criminalRecord: [...ready.legal.criminalRecord, record] },
      prison: {
        inPrison: true,
        sentenceYears,
        remainingYears: sentenceYears,
        securityLevel: crime.severity >= 7 ? "maximum" as const : crime.severity >= 4 ? "medium" as const : "minimum" as const,
        behavior: 50,
        respect: Math.min(100, crime.severity * 8)
      }
    };
    const entry = log(next, "p1.log.crime.arrest", { crimeId, sentenceYears });
    return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
  }

  const next = { ...ready, legal: { ...ready.legal, wantedLevel: Math.min(100, ready.legal.wantedLevel + crime.severity) } };
  const entry = log(next, "p1.log.crime.fail", { crimeId });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}
