import type { GameCatalog } from "../content/schema";
import { clampRelationship, clampStat } from "./clamp";
import { applyEffect } from "./effects";
import { stageForAge } from "./lifeGenerator";
import { createRng } from "./rng";
import { buildDeathSummary } from "./scoring";
import type { CareerState, DiseaseState, EducationState, LifeLogEntry, LifeState } from "./types";

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

function settleDeath(life: LifeState, catalog: GameCatalog, causeOfDeath: string): LifeState {
  if (!life.alive || life.stats.health > 0) return life;

  return {
    ...life,
    alive: false,
    pendingEventId: undefined,
    death: buildDeathSummary({ life: { ...life, alive: false, pendingEventId: undefined }, catalog, causeOfDeath })
  };
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

  if (!next.pendingEventId && next.age >= 6) {
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

  if (next.stats.health <= 0) {
    next = settleDeath(next, catalog, "low_health");
  } else if (next.age >= 90 && rng.int(1, 100) <= next.age - 85) {
    next.alive = false;
    next.pendingEventId = undefined;
    next.death = buildDeathSummary({
      life: next,
      catalog,
      causeOfDeath: next.stats.health <= 0 ? "low_health" : "old_age"
    });
  }

  return { life: next, logs: [log] };
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
  next = settleDeath(next, catalog, "low_health");
  return { life: next, logs: [log] };
}
