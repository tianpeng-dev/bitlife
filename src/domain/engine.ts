import type { GameCatalog } from "../content/schema";
import { clampRelationship, clampStat } from "./clamp";
import { applyEffect } from "./effects";
import { stageForAge } from "./lifeGenerator";
import { createRng, type Rng } from "./rng";
import { buildDeathSummary } from "./scoring";
import type {
  CareerState,
  ConsequenceOutcome,
  DiseaseState,
  EducationState,
  LifeLogEntry,
  LifeState,
  PendingConsequence
} from "./types";

interface EngineResult {
  life: LifeState;
  logs: LifeLogEntry[];
}

const LOTTERY_JACKPOT_ODDS = 10_000;
const LOTTERY_JACKPOT_MIN = 250_000;
const LOTTERY_JACKPOT_MAX = 5_000_000;

function createLog(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return {
    id: `${life.age}-${messageKey}-${life.log.length + 1}`,
    age: life.age,
    messageKey,
    params
  };
}

function settleDeath(life: LifeState, catalog: GameCatalog, causeOfDeath: string, force = false): LifeState {
  if (!life.alive || (!force && life.stats.health > 0)) return life;
  const deadLife = {
    ...life,
    alive: false,
    pendingEventId: undefined,
    pendingConsequences: []
  };

  return {
    ...deadLife,
    death: buildDeathSummary({ life: deadLife, catalog, causeOfDeath })
  };
}

function choiceLooksRisky(choiceId: string, effects: GameCatalog["events"][number]["choices"][number]["effects"]): boolean {
  const riskyChoiceIds = new Set(["argue", "push", "ignore", "keep", "fight", "hide", "accuse", "buy", "scroll"]);
  return (
    riskyChoiceIds.has(choiceId) ||
    effects.some((effect) => (effect.stats?.health ?? 0) <= -3 || Boolean(effect.addDiseaseId))
  );
}

function outcomeWeights(risky: boolean, life: LifeState): Array<{ value: ConsequenceOutcome; weight: number }> {
  const fragileHealth = life.stats.health <= 35;
  return [
    { value: "lucky_break", weight: risky ? 6 : 16 },
    { value: "injury", weight: risky ? 24 : 8 },
    { value: "reputation", weight: 14 },
    { value: "regret", weight: risky ? 22 : 10 },
    { value: "health_scare", weight: risky || fragileHealth ? 18 : 6 },
    { value: "relationship_echo", weight: 14 },
    { value: "fatal_accident", weight: risky ? 2 : 0.35 }
  ];
}

function scheduleButterflyConsequences({
  life,
  source,
  originId,
  choiceId,
  risky
}: {
  life: LifeState;
  source: PendingConsequence["source"];
  originId: string;
  choiceId?: string;
  risky: boolean;
}): LifeState {
  if (!life.alive) return life;

  const rng = createRng(`${life.seed}:butterfly:schedule:${life.age}:${source}:${originId}:${choiceId ?? "none"}:${life.log.length}`);
  const chance = risky ? 100 : source === "choice" ? 38 : 26;
  if (rng.int(1, 100) > chance) return life;

  const count = risky && rng.int(1, 100) <= 18 ? 2 : 1;
  const pending = [...(life.pendingConsequences ?? [])];
  for (let index = 0; index < count; index += 1) {
    const delay = rng.int(1, life.age <= 12 ? 6 : 4);
    const outcome = rng.weighted(outcomeWeights(risky, life));
    const triggerAge = life.age + delay;
    pending.push({
      id: `${source}-${originId}-${choiceId ?? "activity"}-${life.age}-${index}-${rng.int(1000, 9999)}`,
      source,
      originId,
      choiceId,
      triggerAge,
      outcome,
      intensity: rng.int(risky ? 2 : 1, risky ? 5 : 4)
    });
  }

  return { ...life, pendingConsequences: pending };
}

function addDisease(life: LifeState, diseaseId: string, severity: number): LifeState {
  if (life.diseases.some((disease) => disease.id === diseaseId)) return life;
  return {
    ...life,
    diseases: [...life.diseases, { id: diseaseId, severity, diagnosed: false, yearsActive: 0 }]
  };
}

function applyLotteryJackpot(life: LifeState, eventId: string, choiceId: string): EngineResult {
  if (eventId !== "lottery_ad" || choiceId !== "buy") return { life, logs: [] };

  const rng = createRng(`${life.seed}:lottery:${life.age}:${eventId}:${choiceId}:${life.log.length}`);
  if (rng.int(1, LOTTERY_JACKPOT_ODDS) !== 1) return { life, logs: [] };

  const amount = rng.int(LOTTERY_JACKPOT_MIN, LOTTERY_JACKPOT_MAX);
  const next = applyEffect(life, {
    cash: amount,
    stats: { happiness: 20 },
    addFlag: "won_lottery_jackpot"
  });
  const log = createLog(next, "log.lottery_jackpot", { amount });

  return { life: { ...next, log: [...next.log, log] }, logs: [log] };
}

function applyButterflyOutcome(
  life: LifeState,
  catalog: GameCatalog,
  consequence: PendingConsequence,
  rng: Rng
): LifeState {
  let next = structuredClone(life);
  const amount = (min: number, max: number) => rng.int(min, max) * consequence.intensity;

  switch (consequence.outcome) {
    case "lucky_break":
      next = applyEffect(next, {
        cash: amount(80, 420),
        stats: { happiness: amount(1, 3), smarts: rng.int(0, 2) }
      });
      break;
    case "injury":
      next = applyEffect(next, {
        stats: { health: -amount(4, 9), happiness: -amount(1, 3), looks: -rng.int(0, consequence.intensity * 2) }
      });
      if (rng.int(1, 100) <= 65) {
        next = addDisease(next, "sprained_ankle", 10 + consequence.intensity * 4);
      }
      break;
    case "reputation":
      next = applyEffect(next, {
        stats: { happiness: amount(-2, 3), looks: amount(-1, 2) },
        relationship: amount(-2, 3),
        cash: amount(-40, 120)
      });
      break;
    case "regret":
      next = applyEffect(next, {
        stats: { happiness: -amount(3, 7), smarts: rng.int(-2, 1), health: -rng.int(0, consequence.intensity * 2) },
        relationship: -rng.int(0, consequence.intensity * 3)
      });
      if (rng.int(1, 100) <= 35) {
        next = addDisease(next, "anxiety", 8 + consequence.intensity * 4);
      }
      break;
    case "health_scare":
      next = applyEffect(next, {
        stats: { health: -amount(5, 10), happiness: -amount(1, 4) },
        cash: -amount(50, 180)
      });
      next = addDisease(next, rng.pick(["flu", "migraine", "back_pain", "high_blood_pressure"]), 10 + consequence.intensity * 5);
      break;
    case "relationship_echo":
      next = applyEffect(next, {
        relationship: amount(-3, 5),
        stats: { happiness: amount(-2, 3) }
      });
      break;
    case "fatal_accident":
      next.stats.health = 0;
      next = settleDeath(next, catalog, "accident", true);
      break;
  }

  if (next.alive) {
    next = settleDeath(next, catalog, "low_health");
  }
  return next;
}

function applyDueButterflyConsequences(life: LifeState, catalog: GameCatalog): EngineResult {
  let next = structuredClone(life);
  const pending = next.pendingConsequences ?? [];
  const due = pending.filter((consequence) => consequence.triggerAge <= next.age);
  next.pendingConsequences = pending.filter((consequence) => consequence.triggerAge > next.age);
  const logs: LifeLogEntry[] = [];

  for (const consequence of due) {
    const rng = createRng(`${next.seed}:butterfly:resolve:${consequence.id}:${next.age}`);
    next = applyButterflyOutcome(next, catalog, consequence, rng);
    const log = createLog(next, `log.butterfly.${consequence.outcome}`, {
      originId: consequence.originId,
      choiceId: consequence.choiceId ?? "",
      source: consequence.source
    });
    next.log = [...next.log, log];
    logs.push(log);

    if (!next.alive) {
      next.pendingConsequences = [];
      break;
    }
  }

  return { life: next, logs };
}

function progressEducation(life: LifeState, catalog: GameCatalog): EducationState {
  const country = catalog.countries.find((item) => item.id === life.countryId) ?? catalog.countries[0];
  if (life.age < country.schoolStartAge) return { stage: "none", yearsCompleted: 0 };
  if (life.age < 13) return { stage: "primary", yearsCompleted: life.age - country.schoolStartAge + 1 };
  if (life.age < 18) return { stage: "secondary", yearsCompleted: life.age - country.schoolStartAge + 1 };
  if (life.age < 22) return { stage: "university", yearsCompleted: life.age - country.schoolStartAge + 1 };
  return { stage: "graduated", yearsCompleted: life.age - country.schoolStartAge + 1 };
}

function progressCareer(life: LifeState, catalog: GameCatalog, rng: ReturnType<typeof createRng>): CareerState {
  const country = catalog.countries.find((item) => item.id === life.countryId) ?? catalog.countries[0];
  if (life.age < country.adultAge) return { salary: 0, performance: 0, years: 0 };

  const currentCareer = catalog.careers.find((career) => career.id === life.career.careerId);
  if (currentCareer) {
    return {
      ...life.career,
      salary: currentCareer.salary,
      years: life.career.years + 1,
      performance: clampStat(life.career.performance + rng.int(-3, 5) + (life.stats.smarts >= 70 ? 1 : 0))
    };
  }

  const eligibleCareers = catalog.careers.filter(
    (career) => life.age >= career.minAge && life.stats.smarts >= career.requiredSmarts
  );
  if (eligibleCareers.length === 0) {
    return { salary: 0, performance: 0, years: 0 };
  }

  const career = rng.pick(eligibleCareers);
  return {
    careerId: career.id,
    salary: career.salary,
    performance: clampStat(45 + rng.int(-10, 15)),
    years: 1
  };
}

function progressDiseases(
  diseases: DiseaseState[],
  catalog: GameCatalog
): { diseases: DiseaseState[]; healthDrain: number } {
  let healthDrain = 0;
  const nextDiseases = diseases.map((disease) => {
    const definition = catalog.diseases.find((item) => item.id === disease.id);
    if (!definition) return { ...disease, yearsActive: disease.yearsActive + 1 };

    const severity = clampStat(disease.severity + Math.max(1, Math.ceil(definition.severity / 12)));
    healthDrain += Math.max(1, Math.round(definition.healthDrain * (severity / 100)));
    return {
      ...disease,
      severity,
      diagnosed: true,
      yearsActive: disease.yearsActive + 1
    };
  });

  return { diseases: nextDiseases, healthDrain };
}

function treatDiseases(life: LifeState, catalog: GameCatalog, activityId: string): LifeState {
  if (!["doctor", "therapy", "vaccination"].includes(activityId) || life.diseases.length === 0) return life;

  const rng = createRng(`${life.seed}:treat:${life.age}:${activityId}`);
  const diseases = life.diseases
    .map((disease) => {
      const definition = catalog.diseases.find((item) => item.id === disease.id);
      if (!definition) return disease;

      const treatChance = activityId === "doctor" ? definition.treatability : definition.treatability * 0.45;
      if (rng.int(1, 100) <= Math.round(treatChance * 100)) {
        return undefined;
      }

      return {
        ...disease,
        diagnosed: true,
        severity: clampStat(disease.severity - Math.max(5, Math.round(definition.severity * 0.25)))
      };
    })
    .filter((disease): disease is DiseaseState => disease !== undefined);

  return { ...life, diseases };
}

export function advanceYear({ life, catalog }: { life: LifeState; catalog: GameCatalog }): EngineResult {
  if (!life.alive) return { life, logs: [] };

  const rng = createRng(`${life.seed}:age:${life.age + 1}`);
  const logs: LifeLogEntry[] = [];
  let next: LifeState = structuredClone(life);
  next.age += 1;
  next.stage = stageForAge(next.age);
  next.freeActivitiesCompletedThisYear = [];
  next.stats.happiness = clampStat(next.stats.happiness + rng.int(-2, 2));
  next.stats.health = clampStat(next.stats.health + rng.int(-2, 1));
  next.stats.smarts = clampStat(next.stats.smarts + rng.int(0, 1));
  next.stats.looks = clampStat(next.stats.looks + (next.age > 45 ? rng.int(-2, 0) : rng.int(-1, 1)));
  next.education = progressEducation(next, catalog);
  next.career = progressCareer(next, catalog, rng);
  if (next.career.salary > 0) {
    next.cash += Math.round(next.career.salary / 12);
  }
  const diseaseProgress = progressDiseases(next.diseases, catalog);
  next.diseases = diseaseProgress.diseases;
  next.stats.health = clampStat(next.stats.health - diseaseProgress.healthDrain);
  next.relationships = next.relationships.map((person) => ({
    ...person,
    age: person.age + 1,
    relationship: clampRelationship(person.relationship + rng.int(-2, 1))
  }));

  const log = createLog(next, "log.age_up", { age: next.age });
  next.log = [...next.log, log];
  logs.push(log);

  const consequenceResult = applyDueButterflyConsequences(next, catalog);
  next = consequenceResult.life;
  logs.push(...consequenceResult.logs);

  if (next.alive && !next.pendingEventId && next.age >= 6) {
    const eligibleEvents = catalog.events.filter((event) => {
      const underMax = event.maxAge === undefined || next.age <= event.maxAge;
      return next.age >= event.minAge && underMax;
    });
    if (eligibleEvents.length > 0) {
      const event = rng.weighted(eligibleEvents.map((item) => ({ value: item, weight: item.weight })));
      next.pendingEventId = event.id;
    }
  }

  if (next.alive && next.stats.health <= 0) {
    next = settleDeath(next, catalog, "low_health");
  } else if (next.alive && next.age >= 90 && rng.int(1, 100) <= next.age - 85) {
    next.alive = false;
    next.pendingEventId = undefined;
    next.pendingConsequences = [];
    next.death = buildDeathSummary({
      life: next,
      catalog,
      causeOfDeath: next.stats.health <= 0 ? "low_health" : "old_age"
    });
  }

  return { life: next, logs };
}

export function performActivity({
  life,
  catalog,
  activityId
}: {
  life: LifeState;
  catalog: GameCatalog;
  activityId: string;
}): EngineResult {
  if (!life.alive) throw new Error("Cannot perform activities after death");

  const activity = catalog.activities.find((item) => item.id === activityId);
  if (!activity) throw new Error(`Missing activity ${activityId}`);
  const underMax = activity.maxAge === undefined || life.age <= activity.maxAge;
  if (life.age < activity.minAge || !underMax) {
    throw new Error(`Activity ${activityId} is not available`);
  }
  const isFreeActivity = activity.cost === undefined || activity.cost <= 0;
  const completedFreeActivities = life.freeActivitiesCompletedThisYear ?? [];
  if (isFreeActivity && completedFreeActivities.includes(activity.id)) {
    throw new Error(`Activity ${activityId} was already completed this year`);
  }

  let next = structuredClone(life);
  for (const effect of activity.effects) {
    next = applyEffect(next, effect);
  }
  if (isFreeActivity) {
    next.freeActivitiesCompletedThisYear = [...completedFreeActivities, activity.id];
  }
  next = treatDiseases(next, catalog, activityId);
  const log = createLog(next, "log.activity", { activityId });
  next.log = [...next.log, log];
  next = settleDeath(next, catalog, "low_health");
  next = scheduleButterflyConsequences({
    life: next,
    source: "activity",
    originId: activity.id,
    risky: activity.group === "risk"
  });
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
  const jackpotResult = applyLotteryJackpot(next, event.id, choiceId);
  next = jackpotResult.life;
  next = settleDeath(next, catalog, "low_health");
  next = scheduleButterflyConsequences({
    life: next,
    source: "choice",
    originId: event.id,
    choiceId,
    risky: choiceLooksRisky(choice.id, choice.effects)
  });
  return { life: next, logs: [log, ...jackpotResult.logs] };
}
