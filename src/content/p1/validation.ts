import { p1CatalogSchema, type P1ActionConfig, type P1Catalog } from "./schema";

const forbiddenExpressions = ["BitLife", "God Mode", "Bitlife Marketplace"] as const;
const generatedSourcePrefix = "generated:p1:";
const unfinishedMarkerPattern = /\b(?:TODO|FIXME|TBD)\b|placeholder|lorem|待定/i;

type CollectionBounds<T> = {
  label: string;
  items: T[];
  min: number;
  max: number;
};

type NumericRange = {
  min: number;
  max: number;
};

const effectRanges: Record<keyof P1ActionConfig["effects"], NumericRange> = {
  cash: { min: -1_000_000, max: 1_000_000 },
  happiness: { min: -100, max: 100 },
  health: { min: -100, max: 100 },
  smarts: { min: -100, max: 100 },
  looks: { min: -100, max: 100 },
  fame: { min: -100, max: 100 },
  relationship: { min: -100, max: 100 },
  fertility: { min: 0, max: 1 },
  sentenceYears: { min: 0, max: 120 },
  arrestRisk: { min: 0, max: 1 },
  successChance: { min: 0, max: 1 },
  immigrationChance: { min: 0, max: 1 },
  assetCondition: { min: 0, max: 100 },
  petBond: { min: -100, max: 100 },
  socialFollowers: { min: -1_000_000_000, max: 1_000_000_000 },
  prisonTime: { min: -120, max: 120 }
};

function assertUniqueIds(items: Array<{ id: string }>, label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`Duplicate ${label} id: ${item.id}`);
    }
    seen.add(item.id);
  }
}

function assertArraySize<T>({ label, items, min, max }: CollectionBounds<T>): void {
  if (items.length < min || items.length > max) {
    throw new Error(`Invalid ${label} size: expected ${min}-${max}, received ${items.length}`);
  }
}

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid finite P1 number for ${label}: ${value}`);
  }
}

function assertRange(value: number, range: NumericRange, label: string): void {
  assertFiniteNumber(value, label);
  if (value < range.min || value > range.max) {
    throw new Error(`Invalid P1 numeric range for ${label}: ${value}`);
  }
}

function assertGeneratedArraySizes(catalog: P1Catalog): void {
  const bounds: Array<CollectionBounds<unknown>> = [
    { label: "P1 assets", items: catalog.assets, min: 6, max: 200 },
    { label: "P1 crimes", items: catalog.crimes, min: 6, max: 200 },
    { label: "P1 prison activities", items: catalog.prisonActivities, min: 4, max: 200 },
    { label: "P1 country laws", items: catalog.countryLaw, min: 1, max: 250 },
    { label: "P1 fame activities", items: catalog.fameActivities, min: 4, max: 200 },
    { label: "P1 social platforms", items: catalog.socialPlatforms, min: 3, max: 100 },
    { label: "P1 pets", items: catalog.pets, min: 5, max: 200 },
    { label: "P1 travel activities", items: catalog.travelActivities, min: 4, max: 200 },
    { label: "P1 romance activities", items: catalog.romanceActivities, min: 6, max: 200 }
  ];

  for (const bound of bounds) {
    assertArraySize(bound);
  }
}

function assertUniqueCountryLawCountryIds(countryLaw: P1Catalog["countryLaw"]): void {
  const seen = new Set<string>();
  for (const law of countryLaw) {
    if (seen.has(law.countryId)) {
      throw new Error(`Duplicate P1 country law countryId: ${law.countryId}`);
    }
    seen.add(law.countryId);
  }
}

function assertCountryLawCoverage(countryLaw: P1Catalog["countryLaw"], allowedCountryIds: readonly string[]): void {
  const countryIds = new Set(allowedCountryIds);
  const countryLawIds = new Set(countryLaw.map((law) => law.countryId));
  const missingCountryLaw = allowedCountryIds.filter((countryId) => !countryLawIds.has(countryId));
  const orphanCountryLaw = countryLaw.map((law) => law.countryId).filter((countryId) => !countryIds.has(countryId));

  if (missingCountryLaw.length > 0) {
    throw new Error(`Missing P1 country law for countries: ${missingCountryLaw.join(", ")}`);
  }

  if (orphanCountryLaw.length > 0) {
    throw new Error(`P1 country law references missing countries: ${orphanCountryLaw.join(", ")}`);
  }
}

function assertGeneratedSources(items: Array<{ source: string }>, label: string, expectedSource: string): void {
  for (const item of items) {
    if (!item.source.startsWith(generatedSourcePrefix)) {
      throw new Error(`Invalid generated P1 source prefix for ${label}: ${item.source}`);
    }
    if (item.source !== expectedSource) {
      throw new Error(`Invalid generated P1 source for ${label}: ${item.source}`);
    }
  }
}

function assertGeneratedSourceMetadata(catalog: P1Catalog): void {
  assertGeneratedSources(catalog.assets, "asset", "generated:p1:assets");
  assertGeneratedSources(catalog.crimes, "crime", "generated:p1:crimes");
  assertGeneratedSources(catalog.prisonActivities, "prison activity", "generated:p1:prison");
  assertGeneratedSources(catalog.countryLaw, "country law", "generated:p1:country-law");
  assertGeneratedSources(catalog.fameActivities, "fame activity", "generated:p1:fame-social");
  assertGeneratedSources(catalog.socialPlatforms, "social platform", "generated:p1:fame-social");
  assertGeneratedSources(catalog.pets, "pet", "generated:p1:pets");
  assertGeneratedSources(catalog.travelActivities, "travel activity", "generated:p1:travel-migration");
  assertGeneratedSources(catalog.romanceActivities, "romance activity", "generated:p1:romance-family");
}

function assertLocaleCoverage(locale: Record<string, string>, keys: string[], message: string): void {
  const missing = keys.filter((key) => !locale[key]);
  if (missing.length > 0) {
    throw new Error(`${message}: ${missing.join(", ")}`);
  }
}

function actionLocaleKeys(actions: P1ActionConfig[]): string[] {
  return actions.flatMap((action) => [action.labelKey, action.resultKey]);
}

function visibleLocaleKeys(catalog: P1Catalog): string[] {
  return [
    ...catalog.assets.map((asset) => asset.nameKey),
    ...catalog.crimes.map((crime) => crime.nameKey),
    ...actionLocaleKeys(catalog.prisonActivities),
    ...actionLocaleKeys(catalog.fameActivities),
    ...catalog.socialPlatforms.map((platform) => platform.nameKey),
    ...catalog.pets.map((pet) => pet.nameKey),
    ...actionLocaleKeys(catalog.travelActivities),
    ...actionLocaleKeys(catalog.romanceActivities)
  ];
}

function assertNoForbiddenExpressions(catalog: P1Catalog): void {
  for (const [localeId, locale] of Object.entries(catalog.locales)) {
    for (const [key, value] of Object.entries(locale)) {
      const forbidden = forbiddenExpressions.find((expression) => value.includes(expression));
      if (forbidden) {
        throw new Error(`Forbidden P1 expression in ${localeId} ${key}: ${forbidden}`);
      }
    }
  }
}

function assertNoUnfinishedMarkers(catalog: P1Catalog): void {
  for (const [localeId, locale] of Object.entries(catalog.locales)) {
    for (const [key, value] of Object.entries(locale)) {
      const marker = unfinishedMarkerPattern.exec(value)?.[0];
      if (marker) {
        throw new Error(`Unfinished P1 locale marker in ${localeId} ${key}: ${marker}`);
      }
    }
  }
}

function normalizeVisibleValue(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function isDuplicateCandidate(value: string): boolean {
  const withoutPunctuation = value.replace(/[\p{P}\p{S}\s]/gu, "");
  return withoutPunctuation.length >= 4;
}

function assertNoRepeatedVisibleValues(catalog: P1Catalog, visibleKeys: string[]): void {
  for (const [localeId, locale] of Object.entries(catalog.locales)) {
    const seen = new Map<string, string>();

    for (const key of visibleKeys) {
      const value = locale[key];
      if (!value || !isDuplicateCandidate(value)) continue;

      const normalized = normalizeVisibleValue(value);
      const existingKey = seen.get(normalized);
      if (existingKey) {
        throw new Error(`Duplicate visible P1 locale value in ${localeId}: ${existingKey}, ${key}`);
      }
      seen.set(normalized, key);
    }
  }
}

function assertRequirementSanity(requirements: P1ActionConfig["requirements"], label: string): void {
  if (requirements.inPrison && requirements.notInPrison) {
    throw new Error(`Contradictory P1 action requirements for ${label}`);
  }
  if (requirements.minAge !== undefined) {
    assertRange(requirements.minAge, { min: 0, max: 120 }, `${label} minAge`);
  }
  if (requirements.maxAge !== undefined) {
    assertRange(requirements.maxAge, { min: 0, max: 120 }, `${label} maxAge`);
  }
  if (requirements.minCash !== undefined) {
    assertRange(requirements.minCash, { min: 0, max: 10_000_000 }, `${label} minCash`);
  }
  if (requirements.minFame !== undefined) {
    assertRange(requirements.minFame, { min: 0, max: 100 }, `${label} minFame`);
  }
}

function assertActionSanity(actions: P1ActionConfig[], label: string): void {
  for (const action of actions) {
    assertRequirementSanity(action.requirements, `${label} ${action.id}`);

    const effects = Object.entries(action.effects) as Array<[keyof P1ActionConfig["effects"], number]>;
    if (effects.length === 0) {
      throw new Error(`Missing P1 action effects for ${label} ${action.id}`);
    }

    for (const [effect, value] of effects) {
      assertRange(value, effectRanges[effect], `${label} ${action.id} effect ${effect}`);
    }
  }
}

function assertGeneratedNumericSanity(catalog: P1Catalog): void {
  for (const asset of catalog.assets) {
    assertRequirementSanity(asset.requirements, `asset ${asset.id}`);
    assertRange(asset.minPrice, { min: 0, max: 5_000_000 }, `asset ${asset.id} minPrice`);
    assertRange(asset.maxPrice, { min: 0, max: 5_000_000 }, `asset ${asset.id} maxPrice`);
    assertRange(asset.conditionMin, { min: 0, max: 100 }, `asset ${asset.id} conditionMin`);
    assertRange(asset.conditionMax, { min: 0, max: 100 }, `asset ${asset.id} conditionMax`);
    if (asset.maxPrice - asset.minPrice > 5_000_000) {
      throw new Error(`Invalid P1 asset price spread for ${asset.id}`);
    }
  }

  for (const crime of catalog.crimes) {
    assertRequirementSanity(crime.requirements, `crime ${crime.id}`);
    assertRange(crime.severity, { min: 1, max: 10 }, `crime ${crime.id} severity`);
    assertRange(crime.minReward, { min: 0, max: 1_000_000 }, `crime ${crime.id} minReward`);
    assertRange(crime.maxReward, { min: 0, max: 1_000_000 }, `crime ${crime.id} maxReward`);
    assertRange(crime.baseSuccess, { min: 0, max: 1 }, `crime ${crime.id} baseSuccess`);
    assertRange(crime.baseArrest, { min: 0, max: 1 }, `crime ${crime.id} baseArrest`);
    if (crime.baseSuccess + crime.baseArrest > 1) {
      throw new Error(`Invalid P1 crime probability sum for ${crime.id}`);
    }
  }

  for (const law of catalog.countryLaw) {
    assertRange(law.prisonSeverity, { min: 0.5, max: 3 }, `country law ${law.countryId} prisonSeverity`);
    assertRange(law.immigrationDifficulty, { min: 0, max: 1 }, `country law ${law.countryId} immigrationDifficulty`);
    assertRange(law.marriageAge, { min: 12, max: 25 }, `country law ${law.countryId} marriageAge`);
    assertRange(law.assetCostMultiplier, { min: 0.3, max: 5 }, `country law ${law.countryId} assetCostMultiplier`);
  }

  if (catalog.countryLaw.length > 1) {
    const gamblingProfiles = new Set(catalog.countryLaw.map((law) => law.gamblingLegal));
    const prisonSeverityProfiles = new Set(catalog.countryLaw.map((law) => law.prisonSeverity));
    const immigrationProfiles = new Set(catalog.countryLaw.map((law) => law.immigrationDifficulty));
    if (gamblingProfiles.size < 2 || prisonSeverityProfiles.size < 2 || immigrationProfiles.size < 2) {
      throw new Error("P1 country law collection lacks varied generated law profiles");
    }
  }

  for (const platform of catalog.socialPlatforms) {
    assertRange(platform.minAge, { min: 0, max: 21 }, `social platform ${platform.id} minAge`);
  }

  for (const pet of catalog.pets) {
    assertRange(pet.minPrice, { min: 0, max: 100_000 }, `pet ${pet.id} minPrice`);
    assertRange(pet.maxPrice, { min: 0, max: 100_000 }, `pet ${pet.id} maxPrice`);
    assertRange(pet.lifespan, { min: 1, max: 80 }, `pet ${pet.id} lifespan`);
  }

  assertActionSanity(catalog.prisonActivities, "prison activity");
  assertActionSanity(catalog.fameActivities, "fame activity");
  assertActionSanity(catalog.travelActivities, "travel activity");
  assertActionSanity(catalog.romanceActivities, "romance activity");
}

export function validateP1Catalog(input: unknown, allowedCountryIds?: readonly string[]): P1Catalog {
  const parsed = p1CatalogSchema.parse(input);

  assertGeneratedArraySizes(parsed);
  assertUniqueIds(parsed.assets, "P1 asset");
  assertUniqueIds(parsed.crimes, "P1 crime");
  assertUniqueIds(parsed.prisonActivities, "P1 prison activity");
  assertUniqueIds(parsed.fameActivities, "P1 fame activity");
  assertUniqueIds(parsed.socialPlatforms, "P1 social platform");
  assertUniqueIds(parsed.pets, "P1 pet");
  assertUniqueIds(parsed.travelActivities, "P1 travel activity");
  assertUniqueIds(parsed.romanceActivities, "P1 romance activity");
  assertUniqueCountryLawCountryIds(parsed.countryLaw);
  if (allowedCountryIds) {
    assertCountryLawCoverage(parsed.countryLaw, allowedCountryIds);
  }
  assertGeneratedSourceMetadata(parsed);
  assertGeneratedNumericSanity(parsed);

  const requiredKeys = visibleLocaleKeys(parsed);
  assertLocaleCoverage(parsed.locales["zh-CN"], requiredKeys, "Missing zh-CN P1 locale keys");
  assertLocaleCoverage(parsed.locales["en-US"], requiredKeys, "Missing en-US P1 locale keys");
  assertNoForbiddenExpressions(parsed);
  assertNoUnfinishedMarkers(parsed);
  assertNoRepeatedVisibleValues(parsed, requiredKeys);

  return parsed;
}
