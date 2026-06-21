import type { GameCatalog } from "../../content/schema";
import type { P1ActionConfig } from "../../content/p1/schema";
import { clampStat } from "../clamp";
import { createRng } from "../rng";
import type { LifeLogEntry, LifeState, MigrationRecord } from "../types";
import { activityDeniedByLaw, countryLawFor } from "./countriesLaw";
import { ensureP1State } from "./defaultState";

type IllegalEmigrationOutcome = "success" | "deported" | "injured";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

function requireCountry(catalog: GameCatalog, countryId: string): void {
  countryLawFor({ countryId } as LifeState, catalog);
}

function requireNotImprisoned(life: ReturnType<typeof ensureP1State>): void {
  if (life.prison.inPrison) throw new Error("prison.normal_activity_denied");
}

function travelAction(catalog: GameCatalog, activityId: string): P1ActionConfig | undefined {
  return catalog.p1.travelActivities.find((activity) => activity.id === activityId);
}

function actionCost(action: P1ActionConfig | undefined, fallbackCost: number): number {
  if (action?.effects.cash !== undefined && action.effects.cash < 0) return Math.abs(action.effects.cash);
  return action?.requirements.minCash ?? fallbackCost;
}

function appendMigration(life: ReturnType<typeof ensureP1State>, record: MigrationRecord, messageKey: string) {
  const next = { ...life, migrationHistory: [...life.migrationHistory, record] };
  const entry = log(next, messageKey, { fromCountryId: record.fromCountryId, toCountryId: record.toCountryId });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function takeVacation({
  life,
  catalog,
  toCountryId,
  activityId = "p1_travel_vacation"
}: {
  life: LifeState;
  catalog: GameCatalog;
  toCountryId: string;
  activityId?: string;
}) {
  const ready = ensureP1State(life);
  requireNotImprisoned(ready);
  requireCountry(catalog, toCountryId);
  const action = travelAction(catalog, activityId);
  const cost = actionCost(action, 1000);
  if (ready.cash < cost) throw new Error("activity.cash_too_low");

  const next = { ...ready, cash: ready.cash - cost, stats: { ...ready.stats, happiness: clampStat(ready.stats.happiness + 5) } };
  return appendMigration(
    next,
    {
      age: ready.age,
      fromCountryId: ready.countryId,
      toCountryId,
      method: "travel",
      outcome: "completed"
    },
    activityId === "p1_travel_vacation" ? "p1.log.travel.vacation" : action?.resultKey ?? "p1.log.travel.vacation"
  );
}

export function attemptEmigration({
  life,
  catalog,
  toCountryId,
  forceApproved
}: {
  life: LifeState;
  catalog: GameCatalog;
  toCountryId: string;
  forceApproved?: boolean;
}) {
  const ready = ensureP1State(life);
  requireNotImprisoned(ready);
  const emigrationDenial = activityDeniedByLaw(ready, catalog, { law: "emigration" });
  if (emigrationDenial) throw new Error(emigrationDenial);
  const targetLaw = countryLawFor({ ...ready, countryId: toCountryId }, catalog);
  const cost = actionCost(travelAction(catalog, "p1_migration_legal"), 5000);
  if (ready.cash < cost) throw new Error("activity.cash_too_low");

  const rng = createRng(`${ready.seed}:p1:migration:legal:${ready.age}:${ready.countryId}:${toCountryId}:${ready.migrationHistory.length}`);
  const approved = forceApproved ?? rng.next() < Math.max(0.05, 1 - targetLaw.immigrationDifficulty);
  const next = {
    ...ready,
    cash: ready.cash - cost,
    countryId: approved ? toCountryId : ready.countryId
  };
  return appendMigration(
    next,
    {
      age: ready.age,
      fromCountryId: ready.countryId,
      toCountryId,
      method: "legal_emigration",
      outcome: approved ? "approved" : "rejected"
    },
    approved ? "p1.log.migration.legal.approved" : "p1.log.migration.legal.rejected"
  );
}

export function attemptIllegalEmigration({
  life,
  catalog,
  toCountryId,
  forceOutcome
}: {
  life: LifeState;
  catalog: GameCatalog;
  toCountryId: string;
  forceOutcome?: IllegalEmigrationOutcome;
}) {
  const ready = ensureP1State(life);
  requireNotImprisoned(ready);
  requireCountry(catalog, toCountryId);
  const cost = actionCost(travelAction(catalog, "p1_migration_illegal"), 1000);
  if (ready.cash < cost) throw new Error("activity.cash_too_low");

  const rng = createRng(`${ready.seed}:p1:migration:illegal:${ready.age}:${ready.countryId}:${toCountryId}:${ready.migrationHistory.length}`);
  const outcome = forceOutcome ?? rng.weighted<IllegalEmigrationOutcome>([
    { value: "success", weight: 35 },
    { value: "deported", weight: 45 },
    { value: "injured", weight: 20 }
  ]);
  const next = {
    ...ready,
    cash: ready.cash - cost,
    countryId: outcome === "success" ? toCountryId : ready.countryId,
    stats: outcome === "injured" ? { ...ready.stats, health: clampStat(ready.stats.health - 20) } : ready.stats,
    legal: outcome === "success" ? ready.legal : { ...ready.legal, wantedLevel: Math.min(5, ready.legal.wantedLevel + 1) }
  };
  return appendMigration(
    next,
    {
      age: ready.age,
      fromCountryId: ready.countryId,
      toCountryId,
      method: "illegal_emigration",
      outcome: outcome === "success" ? "completed" : outcome === "deported" ? "deported" : "rejected"
    },
    `p1.log.migration.illegal.${outcome}`
  );
}
