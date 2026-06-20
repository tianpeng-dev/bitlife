import { p1CatalogSchema, type P1ActionConfig, type P1Catalog } from "./schema";

const forbiddenExpressions = ["BitLife", "God Mode", "Bitlife Marketplace"] as const;

function assertUniqueIds(items: Array<{ id: string }>, label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`Duplicate ${label} id: ${item.id}`);
    }
    seen.add(item.id);
  }
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

export function validateP1Catalog(input: unknown): P1Catalog {
  const parsed = p1CatalogSchema.parse(input);

  assertUniqueIds(parsed.assets, "P1 asset");
  assertUniqueIds(parsed.crimes, "P1 crime");
  assertUniqueIds(parsed.prisonActivities, "P1 prison activity");
  assertUniqueIds(parsed.fameActivities, "P1 fame activity");
  assertUniqueIds(parsed.socialPlatforms, "P1 social platform");
  assertUniqueIds(parsed.pets, "P1 pet");
  assertUniqueIds(parsed.travelActivities, "P1 travel activity");
  assertUniqueIds(parsed.romanceActivities, "P1 romance activity");

  const requiredKeys = visibleLocaleKeys(parsed);
  assertLocaleCoverage(parsed.locales["zh-CN"], requiredKeys, "Missing zh-CN P1 locale keys");
  assertLocaleCoverage(parsed.locales["en-US"], requiredKeys, "Missing en-US P1 locale keys");
  assertNoForbiddenExpressions(parsed);

  return parsed;
}
