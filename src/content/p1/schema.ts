import { z } from "zod";

export const localizedP1RecordSchema = z.record(z.string().min(1), z.string().min(1));

export const p1RequirementSchema = z.object({
  minAge: z.number().int().min(0).optional(),
  maxAge: z.number().int().min(0).optional(),
  countryIds: z.array(z.string().min(1)).min(1).optional(),
  notInPrison: z.boolean().optional(),
  inPrison: z.boolean().optional(),
  minCash: z.number().min(0).optional(),
  minFame: z.number().min(0).optional()
}).refine((requirements) => requirements.maxAge === undefined || requirements.minAge === undefined || requirements.maxAge >= requirements.minAge, {
  message: "Requirement maxAge must be greater than or equal to minAge",
  path: ["maxAge"]
});

export const p1EffectSchema = z.object({
  cash: z.number().optional(),
  happiness: z.number().optional(),
  health: z.number().optional(),
  smarts: z.number().optional(),
  looks: z.number().optional(),
  fame: z.number().optional(),
  relationship: z.number().optional(),
  fertility: z.number().optional(),
  sentenceYears: z.number().optional(),
  arrestRisk: z.number().optional(),
  successChance: z.number().optional(),
  immigrationChance: z.number().optional(),
  assetCondition: z.number().optional(),
  petBond: z.number().optional(),
  socialFollowers: z.number().optional(),
  prisonTime: z.number().optional()
});

export const p1ActionSchema = z.object({
  id: z.string().min(1),
  labelKey: z.string().min(1),
  resultKey: z.string().min(1),
  requirements: p1RequirementSchema.default({}),
  effects: p1EffectSchema.default({}),
  source: z.string().min(1)
});

export const p1AssetSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  type: z.enum(["home", "vehicle", "jewelry", "instrument", "boat", "plane", "valuable"]),
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0),
  conditionMin: z.number().min(0).max(100),
  conditionMax: z.number().min(0).max(100),
  requirements: p1RequirementSchema.default({}),
  source: z.string().min(1)
}).refine((asset) => asset.maxPrice >= asset.minPrice, {
  message: "Asset maxPrice must be greater than or equal to minPrice",
  path: ["maxPrice"]
}).refine((asset) => asset.conditionMax >= asset.conditionMin, {
  message: "Asset conditionMax must be greater than or equal to conditionMin",
  path: ["conditionMax"]
});

export const p1CrimeSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  severity: z.number().int().min(1).max(10),
  minReward: z.number().min(0),
  maxReward: z.number().min(0),
  baseSuccess: z.number().min(0).max(1),
  baseArrest: z.number().min(0).max(1),
  source: z.string().min(1),
  requirements: p1RequirementSchema.default({})
}).refine((crime) => crime.maxReward >= crime.minReward, {
  message: "Crime maxReward must be greater than or equal to minReward",
  path: ["maxReward"]
});

export const p1PetSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  species: z.string().min(1),
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0),
  lifespan: z.number().int().min(1).max(120),
  source: z.string().min(1)
}).refine((pet) => pet.maxPrice >= pet.minPrice, {
  message: "Pet maxPrice must be greater than or equal to minPrice",
  path: ["maxPrice"]
});

export const p1CountryLawSchema = z.object({
  countryId: z.string().min(1),
  gamblingLegal: z.boolean(),
  prisonSeverity: z.number().min(0.5).max(3),
  immigrationDifficulty: z.number().min(0).max(1),
  marriageAge: z.number().int().min(12).max(25),
  assetCostMultiplier: z.number().min(0.3).max(5),
  source: z.string().min(1)
});

export const p1SocialPlatformSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  minAge: z.number().int().min(0),
  source: z.string().min(1)
});

export const p1CatalogSchema = z.object({
  locales: z.object({
    "zh-CN": localizedP1RecordSchema,
    "en-US": localizedP1RecordSchema
  }),
  assets: z.array(p1AssetSchema),
  crimes: z.array(p1CrimeSchema),
  prisonActivities: z.array(p1ActionSchema),
  countryLaw: z.array(p1CountryLawSchema),
  fameActivities: z.array(p1ActionSchema),
  socialPlatforms: z.array(p1SocialPlatformSchema),
  pets: z.array(p1PetSchema),
  travelActivities: z.array(p1ActionSchema),
  romanceActivities: z.array(p1ActionSchema)
});

export type P1Catalog = z.infer<typeof p1CatalogSchema>;
export type P1AssetConfig = z.infer<typeof p1AssetSchema>;
export type P1CrimeConfig = z.infer<typeof p1CrimeSchema>;
export type P1PetConfig = z.infer<typeof p1PetSchema>;
export type P1ActionConfig = z.infer<typeof p1ActionSchema>;
