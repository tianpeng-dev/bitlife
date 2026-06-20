import { z } from "zod";
import { p1CatalogSchema } from "./p1/schema";
import { validateP1Catalog } from "./p1/validation";

export const localizedRecordSchema = z.record(z.string().min(1), z.string().min(1));

export const effectSchema = z.object({
  stats: z.record(z.enum(["happiness", "health", "smarts", "looks"]), z.number()).optional(),
  cash: z.number().optional(),
  relationship: z.number().optional(),
  addDiseaseId: z.string().optional(),
  addFlag: z.string().optional(),
  logKey: z.string().optional()
}).refine((effect) => Object.values(effect).some((value) => value !== undefined), {
  message: "Effect must include at least one configured value"
});

export const activitySchema = z.object({
  id: z.string().min(1),
  labelKey: z.string().min(1),
  group: z.enum(["mind_body", "relationships", "education_career", "health", "leisure", "risk"]),
  minAge: z.number().int().min(0),
  maxAge: z.number().int().min(0).optional(),
  cost: z.number().optional(),
  effects: z.array(effectSchema).min(1)
}).refine((activity) => activity.maxAge === undefined || activity.maxAge >= activity.minAge, {
  message: "Activity maxAge must be greater than or equal to minAge",
  path: ["maxAge"]
});

export const eventChoiceSchema = z.object({
  id: z.string().min(1),
  labelKey: z.string().min(1),
  effects: z.array(effectSchema).min(1)
});

export const eventSchema = z.object({
  id: z.string().min(1),
  promptKey: z.string().min(1),
  domain: z.enum(["family", "school", "career", "health", "relationship", "misc"]),
  minAge: z.number().int().min(0),
  maxAge: z.number().int().min(0).optional(),
  weight: z.number().positive(),
  choices: z.array(eventChoiceSchema).min(2).max(4)
}).refine((event) => event.maxAge === undefined || event.maxAge >= event.minAge, {
  message: "Event maxAge must be greater than or equal to minAge",
  path: ["maxAge"]
});

export const careerSchema = z.object({
  id: z.string().min(1),
  titleKey: z.string().min(1),
  minAge: z.number().int().min(0),
  salary: z.number().int(),
  requiredSmarts: z.number().min(0).max(100)
});

export const diseaseSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  severity: z.number().min(1).max(100),
  healthDrain: z.number().min(0).max(100),
  treatability: z.number().min(0).max(1)
});

export const countrySchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  cities: z.array(z.string().min(1)).min(1),
  schoolStartAge: z.number().int().min(3),
  adultAge: z.number().int().min(16),
  healthcareCostMultiplier: z.number().positive()
});

export const achievementSchema = z.object({
  id: z.string().min(1),
  labelKey: z.string().min(1),
  priority: z.number().int().min(0)
});

export const catalogSchema = z.object({
  locales: z.object({
    "zh-CN": localizedRecordSchema,
    "en-US": localizedRecordSchema
  }),
  countries: z.array(countrySchema).min(1),
  activities: z.array(activitySchema).min(1),
  events: z.array(eventSchema).min(1),
  careers: z.array(careerSchema).min(1),
  diseases: z.array(diseaseSchema).min(1),
  achievements: z.array(achievementSchema).min(1),
  p1: p1CatalogSchema
});

export type GameCatalog = z.infer<typeof catalogSchema>;
export type EffectConfig = z.infer<typeof effectSchema>;
export type EventConfig = z.infer<typeof eventSchema>;
export type ActivityConfig = z.infer<typeof activitySchema>;

export const requiredGeneratedLocaleKeys = [
  "log.birth",
  "log.age_up",
  "log.choice_resolved",
  "log.activity",
  "log.lottery_jackpot",
  "death.summary"
] as const;

function assertUniqueIds(items: Array<{ id: string }>, label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`Duplicate ${label} id: ${item.id}`);
    }
    seen.add(item.id);
  }
}

function assertUniqueEventChoiceIds(event: EventConfig): void {
  const seen = new Set<string>();
  for (const choice of event.choices) {
    if (seen.has(choice.id)) {
      throw new Error(`Duplicate choice id in event ${event.id}: ${choice.id}`);
    }
    seen.add(choice.id);
  }
}

function assertLocaleCoverage(locale: Record<string, string>, keys: string[], message: string): void {
  const missing = keys.filter((key) => !locale[key]);
  if (missing.length > 0) {
    throw new Error(`${message}: ${missing.join(", ")}`);
  }
}

export function validateCatalog(catalog: unknown): GameCatalog {
  const parsed = catalogSchema.parse(catalog);

  validateP1Catalog(
    parsed.p1,
    parsed.countries.map((country) => country.id)
  );

  assertUniqueIds(parsed.countries, "country");
  assertUniqueIds(parsed.activities, "activity");
  assertUniqueIds(parsed.events, "event");
  assertUniqueIds(parsed.careers, "career");
  assertUniqueIds(parsed.diseases, "disease");
  assertUniqueIds(parsed.achievements, "achievement");

  for (const event of parsed.events) {
    assertUniqueEventChoiceIds(event);
  }

  const requiredZhKeys = [
    ...requiredGeneratedLocaleKeys,
    ...parsed.activities.map((item) => item.labelKey),
    ...parsed.events.flatMap((event) => [event.promptKey, ...event.choices.map((choice) => choice.labelKey)]),
    ...parsed.careers.map((item) => item.titleKey),
    ...parsed.diseases.map((item) => item.nameKey),
    ...parsed.countries.map((item) => item.nameKey),
    ...parsed.achievements.map((item) => item.labelKey)
  ];

  assertLocaleCoverage(parsed.locales["zh-CN"], requiredZhKeys, "Missing zh-CN locale keys");
  assertLocaleCoverage(
    parsed.locales["en-US"],
    parsed.countries.map((item) => item.nameKey),
    "Missing en-US country locale keys"
  );

  const diseaseIds = new Set(parsed.diseases.map((disease) => disease.id));
  for (const activity of parsed.activities) {
    for (const effect of activity.effects) {
      if (effect.addDiseaseId && !diseaseIds.has(effect.addDiseaseId)) {
        throw new Error(`Unknown disease id in activity ${activity.id}: ${effect.addDiseaseId}`);
      }
    }
  }
  for (const event of parsed.events) {
    for (const choice of event.choices) {
      for (const effect of choice.effects) {
        if (effect.addDiseaseId && !diseaseIds.has(effect.addDiseaseId)) {
          throw new Error(`Unknown disease id in event ${event.id} choice ${choice.id}: ${effect.addDiseaseId}`);
        }
      }
    }
  }

  return parsed;
}
