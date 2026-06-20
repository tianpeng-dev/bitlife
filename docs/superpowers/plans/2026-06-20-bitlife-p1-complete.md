# BitLife P1 Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete P1 expansion described in `/Users/peng/Documents/Project/bitlife/docs/superpowers/specs/2026-06-20-bitlife-p1-complete-design.md`.

**Architecture:** Keep the current Vite/React/TypeScript/Zustand/IndexedDB/Netlify stack. Split P1 rules into focused pure TypeScript domain modules, extend the content catalog with generated P1 data and heavy validation, then route age-up/activity/event flows through module resolvers.

**Tech Stack:** Vite, React, TypeScript, Zustand, IndexedDB via `idb`, Zod, Vitest, Testing Library, Playwright, Netlify Functions, Netlify Blobs.

---

## Scope Check

The approved design intentionally covers several P1 subsystems in one large version: assets, romance/family, crime, justice/prison, countries/law, fame, social media, pets, and travel/migration. This plan keeps one implementation plan because the user explicitly chose a single large P1 version. To keep execution tractable, each subsystem is implemented as a separate commit-ready task with its own tests.

Do not stage or edit unrelated untracked duplicate files such as `src/App 3.tsx`, `package 2.json`, or any path ending in ` 2.ts`. Use explicit `git add <path>` commands only.

## Target File Structure

```text
src/domain/types.ts                         Expanded serializable P1 state types
src/domain/p1/defaultState.ts               P1 default state and old-save migration helpers
src/domain/p1/activities.ts                 P1 activity availability and dispatch helpers
src/domain/p1/countriesLaw.ts               Country law lookups and availability reasons
src/domain/p1/assets.ts                     Asset purchase/sale/tick logic
src/domain/p1/romanceFamily.ts              Dating, marriage, pregnancy, children, divorce, adoption
src/domain/p1/pets.ts                       Pet purchase/adoption/care/tick logic
src/domain/p1/crimeJustice.ts               Crime attempt, arrest, conviction, legal record
src/domain/p1/prison.ts                     Prison tick and prison-only activities
src/domain/p1/travelMigration.ts            Travel, emigration, illegal migration, deportation
src/domain/p1/fameSocial.ts                 Fame and social media actions/tick logic
src/domain/p1/tick.ts                       Deterministic yearly P1 tick orchestration
src/domain/p1/dispatch.ts                   P1 activity dispatcher
src/domain/p1/summary.ts                    P1 tombstone/public summary fields
src/content/p1/schema.ts                    Zod schemas for P1 catalog modules
src/content/p1/generated/*.generated.ts     Generated P1 catalog entries
src/content/p1/catalog.ts                   P1 catalog merge/export
src/content/p1/validation.ts                P1 validation and scanner functions
src/content/schema.ts                       GameCatalog extended with P1 fields
src/content/catalog.ts                      P0 + P1 catalog composition
src/content/locales.ts                      Existing locale base remains
tools/p1_content/*.ts                       Local reference extraction and generation scripts
src/storage/migrations.ts                   Save schema migration helpers
src/storage/indexedDb.ts                    Apply migration on load
src/store/gameStore.ts                      Route P1 errors/feedback through store
src/views/ActivitiesView.tsx                Grouped/filterable P1 activity UI
src/views/LifeView.tsx                      P1 status summary
src/views/RelationshipsView.tsx             Family/partner/children/pets grouping
src/views/CareerView.tsx                    Fame/social summary
src/views/TombstoneView.tsx                 P1 public summary fields
src/api/tombstonesClient.ts                 P1 tombstone payload fields
netlify/functions/lib/tombstoneSchema.ts    P1 server validation bounds
src/__tests__/p1*.test.ts                   P1 unit/integration/catalog tests
e2e/p1-smoke.spec.ts                        Mobile P1 smoke flows
```

## Implementation Rules

- Keep domain modules pure TypeScript. They must not import React, Zustand, IndexedDB, or browser APIs.
- Keep every new state block serializable.
- Use seeded RNG inputs derived from `life.seed`, age, activity id, and module name.
- Use reason codes for unavailable actions. UI turns reason codes into localized labels.
- Add tests before implementation within each task.
- End each task with a focused commit.
- Run `npm run test` and `npm run build` after integration-heavy tasks.

---

### Task 1: P1 State Defaults And Save Migration

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/p1/defaultState.ts`
- Create: `src/storage/migrations.ts`
- Modify: `src/storage/indexedDb.ts`
- Create: `src/__tests__/p1StateMigration.test.ts`

- [ ] **Step 1: Write the failing migration test**

Create `src/__tests__/p1StateMigration.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State, P1_SAVE_VERSION } from "../domain/p1/defaultState";
import { migrateLifeState } from "../storage/migrations";

describe("P1 state migration", () => {
  it("adds every P1 state block to an old life", () => {
    const oldLife = generateLife({ seed: "old-save", catalog });
    const migrated = migrateLifeState(oldLife);

    expect(migrated.saveVersion).toBe(P1_SAVE_VERSION);
    expect(migrated.assets.items).toEqual([]);
    expect(migrated.legal.criminalRecord).toEqual([]);
    expect(migrated.prison.inPrison).toBe(false);
    expect(migrated.fame.score).toBe(0);
    expect(migrated.socialAccounts).toEqual([]);
    expect(migrated.pets).toEqual([]);
    expect(migrated.migrationHistory).toEqual([]);
  });

  it("does not replace existing P1 state", () => {
    const oldLife = ensureP1State(generateLife({ seed: "existing-p1", catalog }));
    const withPet = {
      ...oldLife,
      pets: [
        {
          id: "pet-1",
          catalogId: "p1_pet_cat",
          name: "Mimi",
          age: 2,
          health: 80,
          relationship: 70,
          alive: true
        }
      ]
    };

    expect(migrateLifeState(withPet).pets).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the migration test and verify it fails**

Run:

```bash
npm run test -- src/__tests__/p1StateMigration.test.ts
```

Expected: FAIL because `src/domain/p1/defaultState.ts` and `src/storage/migrations.ts` do not exist.

- [ ] **Step 3: Extend `LifeState` with P1 types**

Modify `src/domain/types.ts` by adding these exports before `LifeState`:

```ts
export interface OwnedAsset {
  id: string;
  catalogId: string;
  nameKey: string;
  type: "home" | "vehicle" | "jewelry" | "instrument" | "boat" | "plane" | "valuable";
  purchasePrice: number;
  currentValue: number;
  condition: number;
  debt: number;
  acquiredAtAge: number;
  stolen: boolean;
}

export interface LegalRecordEntry {
  id: string;
  crimeId: string;
  age: number;
  convicted: boolean;
  sentenceYears: number;
}

export interface LegalState {
  wantedLevel: number;
  criminalRecord: LegalRecordEntry[];
}

export interface PrisonState {
  inPrison: boolean;
  sentenceYears: number;
  remainingYears: number;
  securityLevel: "minimum" | "medium" | "maximum";
  behavior: number;
  respect: number;
}

export interface FameState {
  source?: string;
  score: number;
  publicSentiment: number;
}

export interface SocialAccountState {
  id: string;
  platformId: string;
  followers: number;
  verified: boolean;
  monetized: boolean;
  banned: boolean;
}

export interface PetState {
  id: string;
  catalogId: string;
  name: string;
  age: number;
  health: number;
  relationship: number;
  alive: boolean;
}

export interface MigrationRecord {
  age: number;
  fromCountryId: string;
  toCountryId: string;
  method: "travel" | "legal_emigration" | "illegal_emigration" | "deportation";
  outcome: "approved" | "rejected" | "completed" | "deported";
}
```

Then add these properties to `LifeState`:

```ts
  saveVersion?: number;
  assets?: { items: OwnedAsset[] };
  legal?: LegalState;
  prison?: PrisonState;
  fame?: FameState;
  socialAccounts?: SocialAccountState[];
  pets?: PetState[];
  migrationHistory?: MigrationRecord[];
```

- [ ] **Step 4: Add P1 default state helpers**

Create `src/domain/p1/defaultState.ts`:

```ts
import type { FameState, LegalState, LifeState, PrisonState } from "../types";

export const P1_SAVE_VERSION = 2;

export function defaultLegalState(): LegalState {
  return { wantedLevel: 0, criminalRecord: [] };
}

export function defaultPrisonState(): PrisonState {
  return {
    inPrison: false,
    sentenceYears: 0,
    remainingYears: 0,
    securityLevel: "minimum",
    behavior: 50,
    respect: 20
  };
}

export function defaultFameState(): FameState {
  return { score: 0, publicSentiment: 50 };
}

export function ensureP1State(life: LifeState): LifeState & Required<Pick<LifeState, "assets" | "legal" | "prison" | "fame" | "socialAccounts" | "pets" | "migrationHistory">> {
  return {
    ...life,
    saveVersion: P1_SAVE_VERSION,
    assets: life.assets ?? { items: [] },
    legal: life.legal ?? defaultLegalState(),
    prison: life.prison ?? defaultPrisonState(),
    fame: life.fame ?? defaultFameState(),
    socialAccounts: life.socialAccounts ?? [],
    pets: life.pets ?? [],
    migrationHistory: life.migrationHistory ?? []
  };
}
```

- [ ] **Step 5: Add save migration wrapper**

Create `src/storage/migrations.ts`:

```ts
import { ensureP1State } from "../domain/p1/defaultState";
import type { LifeState } from "../domain/types";

export function migrateLifeState(life: LifeState): LifeState {
  return ensureP1State(life);
}
```

- [ ] **Step 6: Apply migration when reading IndexedDB**

Modify `src/storage/indexedDb.ts`:

```ts
import { openDB } from "idb";
import type { LifeState } from "../domain/types";
import { migrateLifeState } from "./migrations";

const DB_NAME = "text-life-db";
const DB_VERSION = 1;

async function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("saves")) {
        database.createObjectStore("saves");
      }
      if (!database.objectStoreNames.contains("tombstones")) {
        database.createObjectStore("tombstones", { keyPath: "id" });
      }
    }
  });
}

export async function saveActiveLife(life: LifeState): Promise<void> {
  const database = await db();
  await database.put("saves", migrateLifeState(life), "active");
}

export async function saveCompletedLife(life: LifeState): Promise<void> {
  if (!life.death) return;

  const database = await db();
  await database.put("tombstones", migrateLifeState(life));
}

export async function listCompletedLives(): Promise<LifeState[]> {
  const database = await db();
  const lives = await database.getAll("tombstones");
  return lives.map(migrateLifeState);
}

export async function loadActiveLife(): Promise<LifeState | undefined> {
  const database = await db();
  const life = await database.get("saves", "active");
  return life ? migrateLifeState(life) : undefined;
}

export async function clearActiveLife(): Promise<void> {
  const database = await db();
  await database.delete("saves", "active");
}
```

- [ ] **Step 7: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1StateMigration.test.ts src/__tests__/engine.test.ts src/__tests__/gameStore.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/domain/types.ts src/domain/p1/defaultState.ts src/storage/migrations.ts src/storage/indexedDb.ts src/__tests__/p1StateMigration.test.ts
git commit -m "feat: add p1 state migration"
```

---

### Task 2: P1 Catalog Schemas And Validation

**Files:**
- Create: `src/content/p1/schema.ts`
- Create: `src/content/p1/generated/*.generated.ts`
- Create: `src/content/p1/overrides/*.ts`
- Create: `src/content/p1/catalog.ts`
- Create: `src/content/p1/locale.ts`
- Create: `src/content/p1/validation.ts`
- Modify: `src/content/schema.ts`
- Modify: `src/content/catalog.ts`
- Create: `src/__tests__/p1CatalogValidation.test.ts`

- [ ] **Step 1: Write failing P1 catalog validation tests**

Create `src/__tests__/p1CatalogValidation.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { validateCatalog } from "../content/schema";
import { p1Catalog } from "../content/p1/catalog";
import { validateP1Catalog } from "../content/p1/validation";

describe("P1 catalog validation", () => {
  it("loads all P1 catalog modules", () => {
    expect(p1Catalog.assets.length).toBeGreaterThanOrEqual(6);
    expect(p1Catalog.crimes.length).toBeGreaterThanOrEqual(6);
    expect(p1Catalog.prisonActivities.length).toBeGreaterThanOrEqual(4);
    expect(p1Catalog.countryLaw.length).toBeGreaterThanOrEqual(5);
    expect(p1Catalog.fameActivities.length).toBeGreaterThanOrEqual(4);
    expect(p1Catalog.socialPlatforms.length).toBeGreaterThanOrEqual(3);
    expect(p1Catalog.pets.length).toBeGreaterThanOrEqual(5);
    expect(p1Catalog.travelActivities.length).toBeGreaterThanOrEqual(4);
    expect(p1Catalog.romanceActivities.length).toBeGreaterThanOrEqual(6);
  });

  it("validates P1 catalog and merged game catalog", () => {
    expect(() => validateP1Catalog(p1Catalog)).not.toThrow();
    expect(() => validateCatalog(catalog)).not.toThrow();
  });

  it("requires complete bilingual labels for visible P1 entries", () => {
    const invalid = structuredClone(p1Catalog);
    delete invalid.locales["en-US"]["p1.asset.compact_apartment.name"];

    expect(() => validateP1Catalog(invalid)).toThrow(/Missing en-US P1 locale keys: p1\.asset\.compact_apartment\.name/);
  });

  it("rejects copied reference expressions", () => {
    const invalid = structuredClone(p1Catalog);
    invalid.locales["zh-CN"]["p1.asset.compact_apartment.name"] = "BitLife Marketplace";

    expect(() => validateP1Catalog(invalid)).toThrow(/Forbidden P1 expression/);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm run test -- src/__tests__/p1CatalogValidation.test.ts
```

Expected: FAIL because `src/content/p1/*` modules do not exist.

- [ ] **Step 3: Create P1 schema**

Create `src/content/p1/schema.ts` with exact schemas:

```ts
import { z } from "zod";

export const localizedP1RecordSchema = z.object({
  "zh-CN": z.record(z.string().min(1), z.string().min(1)),
  "en-US": z.record(z.string().min(1), z.string().min(1))
});

export const p1RequirementSchema = z.object({
  minAge: z.number().int().min(0).optional(),
  maxAge: z.number().int().min(0).optional(),
  countryIds: z.array(z.string().min(1)).optional(),
  notInPrison: z.boolean().optional(),
  inPrison: z.boolean().optional(),
  minCash: z.number().int().optional(),
  minFame: z.number().int().min(0).max(100).optional()
});

export const p1EffectSchema = z.object({
  stats: z.record(z.enum(["happiness", "health", "smarts", "looks"]), z.number()).optional(),
  cash: z.number().int().optional(),
  relationship: z.number().int().optional(),
  fame: z.number().int().optional(),
  followers: z.number().int().optional(),
  wanted: z.number().int().optional()
});

export const p1ActionSchema = z.object({
  id: z.string().min(1),
  labelKey: z.string().min(1),
  resultKey: z.string().min(1),
  requirements: p1RequirementSchema.default({}),
  effects: p1EffectSchema.default({})
});

export const p1AssetSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  type: z.enum(["home", "vehicle", "jewelry", "instrument", "boat", "plane", "valuable"]),
  minPrice: z.number().int().min(0),
  maxPrice: z.number().int().min(0),
  conditionMin: z.number().int().min(1).max(100),
  conditionMax: z.number().int().min(1).max(100),
  requirements: p1RequirementSchema.default({}),
  source: z.string().min(1)
}).refine((item) => item.maxPrice >= item.minPrice, "Asset maxPrice must be >= minPrice")
  .refine((item) => item.conditionMax >= item.conditionMin, "Asset conditionMax must be >= conditionMin");

export const p1CrimeSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  severity: z.number().int().min(1).max(10),
  minReward: z.number().int(),
  maxReward: z.number().int(),
  baseSuccess: z.number().min(0).max(1),
  baseArrest: z.number().min(0).max(1),
  source: z.string().min(1),
  requirements: p1RequirementSchema.default({})
});

export const p1PetSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  species: z.string().min(1),
  minPrice: z.number().int().min(0),
  maxPrice: z.number().int().min(0),
  lifespan: z.number().int().min(1).max(120),
  source: z.string().min(1)
});

export const p1CountryLawSchema = z.object({
  countryId: z.string().min(1),
  gamblingLegal: z.boolean(),
  prisonSeverity: z.number().min(0.5).max(3),
  immigrationDifficulty: z.number().min(0).max(1),
  marriageAge: z.number().int().min(12).max(25),
  assetCostMultiplier: z.number().min(0.3).max(5)
});

export const p1SocialPlatformSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  minAge: z.number().int().min(0),
  source: z.string().min(1)
});

export const p1CatalogSchema = z.object({
  locales: localizedP1RecordSchema,
  assets: z.array(p1AssetSchema).min(1),
  crimes: z.array(p1CrimeSchema).min(1),
  prisonActivities: z.array(p1ActionSchema).min(1),
  countryLaw: z.array(p1CountryLawSchema).min(1),
  fameActivities: z.array(p1ActionSchema).min(1),
  socialPlatforms: z.array(p1SocialPlatformSchema).min(1),
  pets: z.array(p1PetSchema).min(1),
  travelActivities: z.array(p1ActionSchema).min(1),
  romanceActivities: z.array(p1ActionSchema).min(1)
});

export type P1Catalog = z.infer<typeof p1CatalogSchema>;
export type P1AssetConfig = z.infer<typeof p1AssetSchema>;
export type P1CrimeConfig = z.infer<typeof p1CrimeSchema>;
export type P1PetConfig = z.infer<typeof p1PetSchema>;
export type P1ActionConfig = z.infer<typeof p1ActionSchema>;
```

- [ ] **Step 4: Add starter generated P1 catalog files**

Create these generated files with representative starter data:

```text
src/content/p1/generated/assets.generated.ts
src/content/p1/generated/crimes.generated.ts
src/content/p1/generated/prison.generated.ts
src/content/p1/generated/countriesLaw.generated.ts
src/content/p1/generated/fameSocial.generated.ts
src/content/p1/generated/pets.generated.ts
src/content/p1/generated/travelMigration.generated.ts
src/content/p1/generated/romanceFamily.generated.ts
```

Use this pattern in each file:

```ts
import type { P1Catalog } from "../schema";

export const generatedAssets = [
  {
    id: "compact_apartment",
    nameKey: "p1.asset.compact_apartment.name",
    type: "home",
    minPrice: 45000,
    maxPrice: 120000,
    conditionMin: 45,
    conditionMax: 95,
    requirements: { minAge: 18, notInPrison: true },
    source: "generated:p1:assets"
  },
  {
    id: "used_hatchback",
    nameKey: "p1.asset.used_hatchback.name",
    type: "vehicle",
    minPrice: 3000,
    maxPrice: 12000,
    conditionMin: 25,
    conditionMax: 80,
    requirements: { minAge: 18, notInPrison: true },
    source: "generated:p1:assets"
  },
  {
    id: "gold_ring",
    nameKey: "p1.asset.gold_ring.name",
    type: "jewelry",
    minPrice: 500,
    maxPrice: 4000,
    conditionMin: 70,
    conditionMax: 100,
    requirements: { minAge: 16, notInPrison: true },
    source: "generated:p1:assets"
  },
  {
    id: "practice_guitar",
    nameKey: "p1.asset.practice_guitar.name",
    type: "instrument",
    minPrice: 120,
    maxPrice: 900,
    conditionMin: 50,
    conditionMax: 100,
    requirements: { minAge: 8, notInPrison: true },
    source: "generated:p1:assets"
  },
  {
    id: "fishing_boat",
    nameKey: "p1.asset.fishing_boat.name",
    type: "boat",
    minPrice: 10000,
    maxPrice: 60000,
    conditionMin: 40,
    conditionMax: 90,
    requirements: { minAge: 18, notInPrison: true },
    source: "generated:p1:assets"
  },
  {
    id: "small_aircraft",
    nameKey: "p1.asset.small_aircraft.name",
    type: "plane",
    minPrice: 85000,
    maxPrice: 400000,
    conditionMin: 35,
    conditionMax: 90,
    requirements: { minAge: 21, notInPrison: true },
    source: "generated:p1:assets"
  }
] satisfies P1Catalog["assets"];
```

Create `src/content/p1/generated/crimes.generated.ts`:

```ts
import type { P1Catalog } from "../schema";

export const generatedCrimes = [
  { id: "p1_crime_shoplifting", nameKey: "p1.crime.shoplifting.name", severity: 1, minReward: 20, maxReward: 250, baseSuccess: 0.7, baseArrest: 0.22, source: "generated:p1:crimes", requirements: { minAge: 13, notInPrison: true } },
  { id: "p1_crime_pickpocket", nameKey: "p1.crime.pickpocket.name", severity: 2, minReward: 50, maxReward: 700, baseSuccess: 0.58, baseArrest: 0.32, source: "generated:p1:crimes", requirements: { minAge: 14, notInPrison: true } },
  { id: "p1_crime_burglary", nameKey: "p1.crime.burglary.name", severity: 4, minReward: 400, maxReward: 6000, baseSuccess: 0.42, baseArrest: 0.45, source: "generated:p1:crimes", requirements: { minAge: 16, notInPrison: true } },
  { id: "p1_crime_car_theft", nameKey: "p1.crime.car_theft.name", severity: 5, minReward: 1200, maxReward: 12000, baseSuccess: 0.36, baseArrest: 0.52, source: "generated:p1:crimes", requirements: { minAge: 16, notInPrison: true } },
  { id: "p1_crime_bank_robbery", nameKey: "p1.crime.bank_robbery.name", severity: 8, minReward: 8000, maxReward: 90000, baseSuccess: 0.18, baseArrest: 0.72, source: "generated:p1:crimes", requirements: { minAge: 18, notInPrison: true } },
  { id: "p1_crime_fraud", nameKey: "p1.crime.fraud.name", severity: 6, minReward: 1500, maxReward: 40000, baseSuccess: 0.34, baseArrest: 0.5, source: "generated:p1:crimes", requirements: { minAge: 18, notInPrison: true } }
] satisfies P1Catalog["crimes"];
```

Create `src/content/p1/generated/prison.generated.ts`:

```ts
import type { P1Catalog } from "../schema";

export const generatedPrisonActivities = [
  { id: "p1_prison_appeal", labelKey: "p1.prison.appeal.label", resultKey: "p1.prison.appeal.result", requirements: { inPrison: true }, effects: { cash: -500 } },
  { id: "p1_prison_parole", labelKey: "p1.prison.parole.label", resultKey: "p1.prison.parole.result", requirements: { inPrison: true }, effects: {} },
  { id: "p1_prison_work", labelKey: "p1.prison.work.label", resultKey: "p1.prison.work.result", requirements: { inPrison: true }, effects: { cash: 60, stats: { happiness: -1 } } },
  { id: "p1_prison_exercise", labelKey: "p1.prison.exercise.label", resultKey: "p1.prison.exercise.result", requirements: { inPrison: true }, effects: { stats: { health: 2, looks: 1 } } }
] satisfies P1Catalog["prisonActivities"];
```

Create `src/content/p1/generated/countriesLaw.generated.ts`:

```ts
import type { P1Catalog } from "../schema";

export const generatedCountryLaw = [
  { countryId: "us", gamblingLegal: true, prisonSeverity: 1.2, immigrationDifficulty: 0.5, marriageAge: 18, assetCostMultiplier: 1.2 },
  { countryId: "cn", gamblingLegal: false, prisonSeverity: 1.1, immigrationDifficulty: 0.65, marriageAge: 18, assetCostMultiplier: 1.0 },
  { countryId: "jp", gamblingLegal: false, prisonSeverity: 0.9, immigrationDifficulty: 0.7, marriageAge: 18, assetCostMultiplier: 1.4 },
  { countryId: "br", gamblingLegal: true, prisonSeverity: 1.0, immigrationDifficulty: 0.45, marriageAge: 18, assetCostMultiplier: 0.8 },
  { countryId: "se", gamblingLegal: true, prisonSeverity: 0.65, immigrationDifficulty: 0.75, marriageAge: 18, assetCostMultiplier: 1.6 }
] satisfies P1Catalog["countryLaw"];
```

Create `src/content/p1/generated/fameSocial.generated.ts`:

```ts
import type { P1Catalog } from "../schema";

export const generatedFameActivities = [
  { id: "p1_fame_interview", labelKey: "p1.fame.interview.label", resultKey: "p1.fame.interview.result", requirements: { minAge: 18, minFame: 10, notInPrison: true }, effects: { fame: 2, cash: 500 } },
  { id: "p1_fame_ad", labelKey: "p1.fame.ad.label", resultKey: "p1.fame.ad.result", requirements: { minAge: 18, minFame: 20, notInPrison: true }, effects: { fame: 1, cash: 2000 } },
  { id: "p1_fame_charity", labelKey: "p1.fame.charity.label", resultKey: "p1.fame.charity.result", requirements: { minAge: 18, minFame: 10, notInPrison: true }, effects: { fame: 3, cash: -1000 } },
  { id: "p1_fame_scandal_response", labelKey: "p1.fame.scandal_response.label", resultKey: "p1.fame.scandal_response.result", requirements: { minAge: 18, minFame: 15, notInPrison: true }, effects: { fame: 1, stats: { happiness: -2 } } }
] satisfies P1Catalog["fameActivities"];

export const generatedSocialPlatforms = [
  { id: "p1_social_short_video", nameKey: "p1.social.short_video.name", minAge: 13, source: "generated:p1:social" },
  { id: "p1_social_photo_feed", nameKey: "p1.social.photo_feed.name", minAge: 13, source: "generated:p1:social" },
  { id: "p1_social_streaming", nameKey: "p1.social.streaming.name", minAge: 16, source: "generated:p1:social" }
] satisfies P1Catalog["socialPlatforms"];
```

Create `src/content/p1/generated/pets.generated.ts`:

```ts
import type { P1Catalog } from "../schema";

export const generatedPets = [
  { id: "p1_pet_cat", nameKey: "p1.pet.cat.name", species: "cat", minPrice: 40, maxPrice: 400, lifespan: 18, source: "generated:p1:pets" },
  { id: "p1_pet_small_dog", nameKey: "p1.pet.small_dog.name", species: "dog", minPrice: 80, maxPrice: 900, lifespan: 16, source: "generated:p1:pets" },
  { id: "p1_pet_large_dog", nameKey: "p1.pet.large_dog.name", species: "dog", minPrice: 120, maxPrice: 1200, lifespan: 13, source: "generated:p1:pets" },
  { id: "p1_pet_parrot", nameKey: "p1.pet.parrot.name", species: "bird", minPrice: 100, maxPrice: 1500, lifespan: 40, source: "generated:p1:pets" },
  { id: "p1_pet_rabbit", nameKey: "p1.pet.rabbit.name", species: "rabbit", minPrice: 30, maxPrice: 200, lifespan: 10, source: "generated:p1:pets" }
] satisfies P1Catalog["pets"];
```

Create `src/content/p1/generated/travelMigration.generated.ts`:

```ts
import type { P1Catalog } from "../schema";

export const generatedTravelActivities = [
  { id: "p1_travel_vacation", labelKey: "p1.travel.vacation.label", resultKey: "p1.travel.vacation.result", requirements: { minAge: 16, minCash: 1000, notInPrison: true }, effects: { cash: -1000, stats: { happiness: 5 } } },
  { id: "p1_travel_honeymoon", labelKey: "p1.travel.honeymoon.label", resultKey: "p1.travel.honeymoon.result", requirements: { minAge: 18, minCash: 3000, notInPrison: true }, effects: { cash: -3000, relationship: 8 } },
  { id: "p1_migration_legal", labelKey: "p1.migration.legal.label", resultKey: "p1.migration.legal.result", requirements: { minAge: 18, minCash: 5000, notInPrison: true }, effects: { cash: -5000 } },
  { id: "p1_migration_illegal", labelKey: "p1.migration.illegal.label", resultKey: "p1.migration.illegal.result", requirements: { minAge: 18, notInPrison: true }, effects: { wanted: 1, stats: { health: -3 } } }
] satisfies P1Catalog["travelActivities"];
```

Create `src/content/p1/generated/romanceFamily.generated.ts`:

```ts
import type { P1Catalog } from "../schema";

export const generatedRomanceActivities = [
  { id: "p1_romance_date", labelKey: "p1.romance.date.label", resultKey: "p1.romance.date.result", requirements: { minAge: 16, notInPrison: true }, effects: { stats: { happiness: 3 }, relationship: 5 } },
  { id: "p1_romance_propose", labelKey: "p1.romance.propose.label", resultKey: "p1.romance.propose.result", requirements: { minAge: 18, notInPrison: true }, effects: { cash: -1000, relationship: 10 } },
  { id: "p1_family_try_child", labelKey: "p1.family.try_child.label", resultKey: "p1.family.try_child.result", requirements: { minAge: 18, notInPrison: true }, effects: { relationship: 3 } },
  { id: "p1_family_adopt", labelKey: "p1.family.adopt.label", resultKey: "p1.family.adopt.result", requirements: { minAge: 21, minCash: 5000, notInPrison: true }, effects: { cash: -5000, stats: { happiness: 5 } } },
  { id: "p1_romance_divorce", labelKey: "p1.romance.divorce.label", resultKey: "p1.romance.divorce.result", requirements: { minAge: 18, notInPrison: true }, effects: { cash: -2500, stats: { happiness: -8 } } },
  { id: "p1_family_child_time", labelKey: "p1.family.child_time.label", resultKey: "p1.family.child_time.result", requirements: { minAge: 18, notInPrison: true }, effects: { relationship: 6, stats: { happiness: 2 } } }
] satisfies P1Catalog["romanceActivities"];
```

- [ ] **Step 5: Add P1 catalog merge and locale data**

Create `src/content/p1/catalog.ts`:

```ts
import { generatedAssets } from "./generated/assets.generated";
import { generatedCountryLaw } from "./generated/countriesLaw.generated";
import { generatedCrimes } from "./generated/crimes.generated";
import { generatedFameActivities, generatedSocialPlatforms } from "./generated/fameSocial.generated";
import { generatedPets } from "./generated/pets.generated";
import { generatedPrisonActivities } from "./generated/prison.generated";
import { generatedRomanceActivities } from "./generated/romanceFamily.generated";
import { generatedTravelActivities } from "./generated/travelMigration.generated";
import type { P1Catalog } from "./schema";

export const p1Catalog: P1Catalog = {
  locales: {
    "zh-CN": {
      "p1.asset.compact_apartment.name": "紧凑公寓",
      "p1.asset.used_hatchback.name": "二手掀背车",
      "p1.asset.gold_ring.name": "金戒指",
      "p1.asset.practice_guitar.name": "练习吉他",
      "p1.asset.fishing_boat.name": "钓鱼船",
      "p1.asset.small_aircraft.name": "小型飞机"
    },
    "en-US": {
      "p1.asset.compact_apartment.name": "Compact Apartment",
      "p1.asset.used_hatchback.name": "Used Hatchback",
      "p1.asset.gold_ring.name": "Gold Ring",
      "p1.asset.practice_guitar.name": "Practice Guitar",
      "p1.asset.fishing_boat.name": "Fishing Boat",
      "p1.asset.small_aircraft.name": "Small Aircraft"
    }
  },
  assets: generatedAssets,
  crimes: generatedCrimes,
  prisonActivities: generatedPrisonActivities,
  countryLaw: generatedCountryLaw,
  fameActivities: generatedFameActivities,
  socialPlatforms: generatedSocialPlatforms,
  pets: generatedPets,
  travelActivities: generatedTravelActivities,
  romanceActivities: generatedRomanceActivities
};
```

Add the remaining locale keys required by all generated entries in both languages.

- [ ] **Step 6: Add P1 validation**

Create `src/content/p1/validation.ts`:

```ts
import { p1CatalogSchema, type P1Catalog } from "./schema";

const forbiddenExpressions = ["BitLife", "God Mode", "Bitlife Marketplace"];

function assertUniqueIds(items: Array<{ id: string }>, label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`Duplicate P1 ${label} id: ${item.id}`);
    seen.add(item.id);
  }
}

function assertLocaleKeys(catalog: P1Catalog): void {
  const keys = [
    ...catalog.assets.map((item) => item.nameKey),
    ...catalog.crimes.map((item) => item.nameKey),
    ...catalog.prisonActivities.flatMap((item) => [item.labelKey, item.resultKey]),
    ...catalog.fameActivities.flatMap((item) => [item.labelKey, item.resultKey]),
    ...catalog.socialPlatforms.map((item) => item.nameKey),
    ...catalog.pets.map((item) => item.nameKey),
    ...catalog.travelActivities.flatMap((item) => [item.labelKey, item.resultKey]),
    ...catalog.romanceActivities.flatMap((item) => [item.labelKey, item.resultKey])
  ];

  for (const locale of ["zh-CN", "en-US"] as const) {
    const missing = keys.filter((key) => !catalog.locales[locale][key]);
    if (missing.length > 0) {
      throw new Error(`Missing ${locale} P1 locale keys: ${missing.join(", ")}`);
    }
  }
}

function assertNoForbiddenExpressions(catalog: P1Catalog): void {
  for (const [locale, entries] of Object.entries(catalog.locales)) {
    for (const [key, value] of Object.entries(entries)) {
      for (const expression of forbiddenExpressions) {
        if (value.includes(expression)) {
          throw new Error(`Forbidden P1 expression "${expression}" in ${locale}:${key}`);
        }
      }
    }
  }
}

export function validateP1Catalog(input: unknown): P1Catalog {
  const parsed = p1CatalogSchema.parse(input);
  assertUniqueIds(parsed.assets, "asset");
  assertUniqueIds(parsed.crimes, "crime");
  assertUniqueIds(parsed.prisonActivities, "prison activity");
  assertUniqueIds(parsed.fameActivities, "fame activity");
  assertUniqueIds(parsed.socialPlatforms, "social platform");
  assertUniqueIds(parsed.pets, "pet");
  assertUniqueIds(parsed.travelActivities, "travel activity");
  assertUniqueIds(parsed.romanceActivities, "romance activity");
  assertLocaleKeys(parsed);
  assertNoForbiddenExpressions(parsed);
  return parsed;
}
```

- [ ] **Step 7: Extend `GameCatalog`**

Modify `src/content/schema.ts` to import `p1CatalogSchema`, add `p1: p1CatalogSchema` to `catalogSchema`, export P1 types, and call P1 validation from `validateCatalog`.

Modify `src/content/catalog.ts`:

```ts
import { achievements } from "./achievements";
import { activities } from "./activities";
import { careers } from "./careers";
import { countries } from "./countries";
import { diseases } from "./diseases";
import { events } from "./events";
import { locales } from "./locales";
import { p1Catalog } from "./p1/catalog";
import type { GameCatalog } from "./schema";

export const catalog: GameCatalog = {
  locales,
  countries,
  activities,
  events,
  careers,
  diseases,
  achievements,
  p1: p1Catalog
};
```

- [ ] **Step 8: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1CatalogValidation.test.ts src/__tests__/contentSchema.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/content/schema.ts src/content/catalog.ts src/content/p1 src/__tests__/p1CatalogValidation.test.ts
git commit -m "feat: add p1 catalog validation"
```

---

### Task 3: Content Generation Pipeline

**Files:**
- Create: `tools/p1_content/referencePages.ts`
- Create: `tools/p1_content/extract.ts`
- Create: `tools/p1_content/generate.ts`
- Create: `tools/p1_content/scan.ts`
- Modify: `package.json`
- Create: `src/__tests__/p1ContentPipeline.test.ts`

- [ ] **Step 1: Write failing pipeline tests**

Create `src/__tests__/p1ContentPipeline.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { p1ReferencePages } from "../../tools/p1_content/referencePages";
import { extractReferenceOutline } from "../../tools/p1_content/extract";
import { scanForbiddenSimilarity } from "../../tools/p1_content/scan";

describe("P1 content generation pipeline", () => {
  it("declares every P1 reference page used by the feature matrix", () => {
    expect(p1ReferencePages).toEqual(
      expect.arrayContaining([
        "Assets",
        "Relationships",
        "Fertility",
        "Crime",
        "Prison",
        "Lawsuit",
        "Nations",
        "Stats_Fame",
        "Social_Media",
        "Pets",
        "Emigration"
      ])
    );
  });

  it("extracts headings and list-like lines from local text", () => {
    const outline = extractReferenceOutline("== Homes ==\n* Apartment\n* House\n== Vehicles ==\n* Car\n");

    expect(outline.headings).toEqual(["Homes", "Vehicles"]);
    expect(outline.items).toEqual(["Apartment", "House", "Car"]);
  });

  it("flags forbidden visible expressions before generated content ships", () => {
    expect(scanForbiddenSimilarity("A safe generated phrase")).toEqual([]);
    expect(scanForbiddenSimilarity("This mentions BitLife Marketplace")).toContain("BitLife");
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npm run test -- src/__tests__/p1ContentPipeline.test.ts
```

Expected: FAIL because `tools/p1_content/*` does not exist.

- [ ] **Step 3: Create reference page list**

Create `tools/p1_content/referencePages.ts`:

```ts
export const p1ReferencePages = [
  "Assets",
  "Relationships",
  "Fertility",
  "Crime",
  "Prison",
  "Lawsuit",
  "Nations",
  "Stats_Fame",
  "Social_Media",
  "Pets",
  "Emigration"
] as const;
```

- [ ] **Step 4: Create outline extraction helpers**

Create `tools/p1_content/extract.ts`:

```ts
export interface ReferenceOutline {
  headings: string[];
  items: string[];
}

export function extractReferenceOutline(text: string): ReferenceOutline {
  const headings: string[] = [];
  const items: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const headingMatch = line.match(/^=+\s*(.+?)\s*=+$/);
    if (headingMatch) {
      headings.push(headingMatch[1].trim());
      continue;
    }

    const listMatch = line.match(/^(?:\*|#|-)\s+(.+)$/);
    if (listMatch) {
      items.push(listMatch[1].replace(/\[\[|\]\]/g, "").trim());
    }
  }

  return { headings, items };
}
```

- [ ] **Step 5: Create scanner helpers**

Create `tools/p1_content/scan.ts`:

```ts
const forbiddenExpressions = ["BitLife", "God Mode", "Bitlife Marketplace"];

export function scanForbiddenSimilarity(text: string): string[] {
  return forbiddenExpressions.filter((expression) => text.includes(expression));
}
```

- [ ] **Step 6: Create generator entrypoint**

Create `tools/p1_content/generate.ts`:

```ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { p1ReferencePages } from "./referencePages";
import { extractReferenceOutline } from "./extract";

interface CoverageManifest {
  generatedAt: string;
  pages: Array<{ page: string; headings: string[]; itemCount: number }>;
}

function pagePath(root: string, page: string): string {
  return join(root, "data", "wiki_reference", "pages", page, "content.wikitext");
}

export function buildCoverageManifest(root = process.cwd()): CoverageManifest {
  return {
    generatedAt: new Date(0).toISOString(),
    pages: p1ReferencePages.map((page) => {
      const text = readFileSync(pagePath(root, page), "utf8");
      const outline = extractReferenceOutline(text);
      return { page, headings: outline.headings, itemCount: outline.items.length };
    })
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const manifest = buildCoverageManifest();
  writeFileSync("src/content/p1/generated/coverage.manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
}
```

- [ ] **Step 7: Add npm script**

Modify `package.json` scripts:

```json
"p1:generate": "tsx tools/p1_content/generate.ts"
```

If `tsx` is not installed, install it:

```bash
npm install --save-dev tsx
```

- [ ] **Step 8: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1ContentPipeline.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tools/p1_content src/__tests__/p1ContentPipeline.test.ts
git commit -m "feat: add p1 content generation pipeline"
```

---

### Task 4: Countries And Law Module

**Files:**
- Create: `src/domain/p1/countriesLaw.ts`
- Create: `src/__tests__/p1CountriesLaw.test.ts`

- [ ] **Step 1: Write failing law tests**

Create `src/__tests__/p1CountriesLaw.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { activityDeniedByLaw, countryLawFor, sentenceYearsForCrime } from "../domain/p1/countriesLaw";

describe("P1 countries and law", () => {
  it("finds country law for a life country", () => {
    const life = { ...generateLife({ seed: "law-us", catalog }), countryId: "us" };

    expect(countryLawFor(life, catalog).countryId).toBe("us");
  });

  it("denies gambling when country law disallows it", () => {
    const life = { ...generateLife({ seed: "law-gambling", catalog }), age: 18, countryId: "cn" };

    const reason = activityDeniedByLaw(life, catalog, { law: "gambling" });

    expect(reason).toBe("law.gambling_illegal");
  });

  it("scales sentence length by country prison severity", () => {
    const lenient = { ...generateLife({ seed: "law-lenient", catalog }), countryId: "se" };
    const strict = { ...generateLife({ seed: "law-strict", catalog }), countryId: "us" };

    expect(sentenceYearsForCrime(strict, catalog, 5)).toBeGreaterThanOrEqual(sentenceYearsForCrime(lenient, catalog, 5));
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npm run test -- src/__tests__/p1CountriesLaw.test.ts
```

Expected: FAIL because `countriesLaw.ts` does not exist.

- [ ] **Step 3: Implement law helpers**

Create `src/domain/p1/countriesLaw.ts`:

```ts
import type { GameCatalog } from "../../content/schema";
import type { LifeState } from "../types";

export type LawCheck = { law: "gambling" | "marriage" | "emigration" };
export type LawDenialReason = "law.gambling_illegal" | "law.too_young_for_marriage" | "law.emigration_blocked" | undefined;

export function countryLawFor(life: LifeState, catalog: GameCatalog) {
  return catalog.p1.countryLaw.find((law) => law.countryId === life.countryId) ?? catalog.p1.countryLaw[0];
}

export function activityDeniedByLaw(life: LifeState, catalog: GameCatalog, check: LawCheck): LawDenialReason {
  const law = countryLawFor(life, catalog);
  if (check.law === "gambling" && !law.gamblingLegal) return "law.gambling_illegal";
  if (check.law === "marriage" && life.age < law.marriageAge) return "law.too_young_for_marriage";
  if (check.law === "emigration" && law.immigrationDifficulty >= 0.95) return "law.emigration_blocked";
  return undefined;
}

export function sentenceYearsForCrime(life: LifeState, catalog: GameCatalog, severity: number): number {
  const law = countryLawFor(life, catalog);
  return Math.max(1, Math.round(severity * law.prisonSeverity));
}

export function assetPriceWithCountryMultiplier(life: LifeState, catalog: GameCatalog, amount: number): number {
  const law = countryLawFor(life, catalog);
  return Math.max(0, Math.round(amount * law.assetCostMultiplier));
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1CountriesLaw.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/p1/countriesLaw.ts src/__tests__/p1CountriesLaw.test.ts
git commit -m "feat: add p1 country law helpers"
```

---

### Task 5: Assets Module

**Files:**
- Create: `src/domain/p1/assets.ts`
- Create: `src/__tests__/p1Assets.test.ts`

- [ ] **Step 1: Write failing asset tests**

Create `src/__tests__/p1Assets.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { buyAsset, sellAsset, tickAssets } from "../domain/p1/assets";
import { ensureP1State } from "../domain/p1/defaultState";

describe("P1 assets", () => {
  it("buys an affordable asset and updates net worth state", () => {
    const life = ensureP1State({ ...generateLife({ seed: "asset-buy", catalog }), age: 18, cash: 200000 });
    const result = buyAsset({ life, catalog, assetId: "compact_apartment" });

    expect(result.life.cash).toBeLessThan(life.cash);
    expect(result.life.assets.items).toHaveLength(1);
    expect(result.logs[0].messageKey).toBe("p1.log.asset.buy");
  });

  it("rejects unaffordable asset purchases", () => {
    const life = ensureP1State({ ...generateLife({ seed: "asset-poor", catalog }), age: 18, cash: 10 });

    expect(() => buyAsset({ life, catalog, assetId: "compact_apartment" })).toThrow(/activity.cash_too_low/);
  });

  it("sells an owned asset for current value", () => {
    const bought = buyAsset({
      life: ensureP1State({ ...generateLife({ seed: "asset-sell", catalog }), age: 18, cash: 200000 }),
      catalog,
      assetId: "compact_apartment"
    }).life;
    const ownedId = bought.assets.items[0].id;
    const sold = sellAsset({ life: bought, assetInstanceId: ownedId });

    expect(sold.life.assets.items).toHaveLength(0);
    expect(sold.life.cash).toBeGreaterThan(bought.cash);
  });

  it("ages assets without invalid condition values", () => {
    const bought = buyAsset({
      life: ensureP1State({ ...generateLife({ seed: "asset-tick", catalog }), age: 18, cash: 200000 }),
      catalog,
      assetId: "used_hatchback"
    }).life;
    const ticked = tickAssets({ life: bought, catalog });

    expect(ticked.life.assets.items[0].condition).toBeGreaterThanOrEqual(0);
    expect(ticked.life.assets.items[0].condition).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npm run test -- src/__tests__/p1Assets.test.ts
```

Expected: FAIL because `assets.ts` does not exist.

- [ ] **Step 3: Implement asset resolver**

Create `src/domain/p1/assets.ts`:

```ts
import type { GameCatalog } from "../../content/schema";
import { clampStat } from "../clamp";
import type { LifeLogEntry, LifeState, OwnedAsset } from "../types";
import { createRng } from "../rng";
import { assetPriceWithCountryMultiplier } from "./countriesLaw";
import { ensureP1State } from "./defaultState";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

export function buyAsset({ life, catalog, assetId }: { life: LifeState; catalog: GameCatalog; assetId: string }) {
  const ready = ensureP1State(life);
  const config = catalog.p1.assets.find((item) => item.id === assetId);
  if (!config) throw new Error(`asset.missing:${assetId}`);
  if (ready.age < (config.requirements.minAge ?? 0)) throw new Error("activity.too_young");

  const rng = createRng(`${ready.seed}:p1:asset:buy:${assetId}:${ready.age}:${ready.assets.items.length}`);
  const rawPrice = rng.int(config.minPrice, config.maxPrice);
  const price = assetPriceWithCountryMultiplier(ready, catalog, rawPrice);
  if (ready.cash < price) throw new Error("activity.cash_too_low");

  const condition = rng.int(config.conditionMin, config.conditionMax);
  const owned: OwnedAsset = {
    id: `asset-${ready.age}-${assetId}-${rng.int(1000, 9999)}`,
    catalogId: config.id,
    nameKey: config.nameKey,
    type: config.type,
    purchasePrice: price,
    currentValue: Math.round(price * (condition / 100)),
    condition,
    debt: 0,
    acquiredAtAge: ready.age,
    stolen: false
  };
  const next = { ...ready, cash: ready.cash - price, assets: { items: [...ready.assets.items, owned] } };
  const entry = log(next, "p1.log.asset.buy", { assetId, price });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function sellAsset({ life, assetInstanceId }: { life: LifeState; assetInstanceId: string }) {
  const ready = ensureP1State(life);
  const asset = ready.assets.items.find((item) => item.id === assetInstanceId);
  if (!asset) throw new Error(`asset.instance_missing:${assetInstanceId}`);
  const nextItems = ready.assets.items.filter((item) => item.id !== assetInstanceId);
  const next = { ...ready, cash: ready.cash + asset.currentValue, assets: { items: nextItems } };
  const entry = log(next, "p1.log.asset.sell", { assetId: asset.catalogId, amount: asset.currentValue });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function tickAssets({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  const rng = createRng(`${ready.seed}:p1:asset:tick:${ready.age}`);
  const items = ready.assets.items.map((asset) => {
    const condition = clampStat(asset.condition - rng.int(0, asset.type === "vehicle" ? 8 : 4));
    const market = rng.int(92, asset.type === "home" ? 112 : 104) / 100;
    return { ...asset, condition, currentValue: Math.max(0, Math.round(asset.purchasePrice * (condition / 100) * market)) };
  });
  return { life: { ...ready, assets: { items } }, logs: [] as LifeLogEntry[] };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1Assets.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/p1/assets.ts src/__tests__/p1Assets.test.ts
git commit -m "feat: add p1 assets module"
```

---

### Task 6: Romance, Family, And Pets Modules

**Files:**
- Create: `src/domain/p1/romanceFamily.ts`
- Create: `src/domain/p1/pets.ts`
- Create: `src/__tests__/p1RomanceFamily.test.ts`
- Create: `src/__tests__/p1Pets.test.ts`

- [ ] **Step 1: Write failing romance/family tests**

Create `src/__tests__/p1RomanceFamily.test.ts` with tests for `startDating`, `proposeMarriage`, `startPregnancy`, `tickRomanceFamily`, `divorcePartner`, and `adoptChild`.

```ts
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";
import { adoptChild, proposeMarriage, startDating, startPregnancy, tickRomanceFamily } from "../domain/p1/romanceFamily";

describe("P1 romance and family", () => {
  it("creates a lover and can turn them into a spouse", () => {
    const life = ensureP1State({ ...generateLife({ seed: "romance", catalog }), age: 25, cash: 10000 });
    const dating = startDating({ life, catalog }).life;
    const married = proposeMarriage({ life: dating, catalog }).life;

    expect(dating.relationships.some((person) => person.relationType === "lover")).toBe(true);
    expect(married.relationships.some((person) => person.relationType === "spouse")).toBe(true);
  });

  it("can progress pregnancy into a child relationship", () => {
    const married = proposeMarriage({
      life: startDating({ life: ensureP1State({ ...generateLife({ seed: "baby", catalog }), age: 28, cash: 10000 }), catalog }).life,
      catalog
    }).life;
    let pregnant = startPregnancy({ life: married, catalog }).life;

    for (let index = 0; index < 2; index += 1) {
      pregnant = tickRomanceFamily({ life: { ...pregnant, age: pregnant.age + 1 }, catalog }).life;
    }

    expect(pregnant.relationships.some((person) => person.relationType === "child")).toBe(true);
  });

  it("adopts a child when the life can pay the fee", () => {
    const life = ensureP1State({ ...generateLife({ seed: "adopt", catalog }), age: 32, cash: 50000 });
    const adopted = adoptChild({ life, catalog }).life;

    expect(adopted.relationships.some((person) => person.relationType === "child")).toBe(true);
    expect(adopted.cash).toBeLessThan(life.cash);
  });
});
```

- [ ] **Step 2: Write failing pet tests**

Create `src/__tests__/p1Pets.test.ts` with tests for `adoptPet`, `careForPet`, and `tickPets`.

```ts
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";
import { adoptPet, careForPet, tickPets } from "../domain/p1/pets";

describe("P1 pets", () => {
  it("adopts a pet and charges cash", () => {
    const life = ensureP1State({ ...generateLife({ seed: "pet", catalog }), age: 18, cash: 5000 });
    const result = adoptPet({ life, catalog, petId: "p1_pet_cat" });

    expect(result.life.pets).toHaveLength(1);
    expect(result.life.cash).toBeLessThan(life.cash);
  });

  it("care improves pet health and relationship", () => {
    const adopted = adoptPet({
      life: ensureP1State({ ...generateLife({ seed: "pet-care", catalog }), age: 18, cash: 5000 }),
      catalog,
      petId: "p1_pet_cat"
    }).life;
    const cared = careForPet({ life: adopted, petInstanceId: adopted.pets[0].id });

    expect(cared.life.pets[0].health).toBeGreaterThanOrEqual(adopted.pets[0].health);
    expect(cared.life.pets[0].relationship).toBeGreaterThan(adopted.pets[0].relationship);
  });

  it("ticks pet age", () => {
    const adopted = adoptPet({
      life: ensureP1State({ ...generateLife({ seed: "pet-tick", catalog }), age: 18, cash: 5000 }),
      catalog,
      petId: "p1_pet_cat"
    }).life;
    const ticked = tickPets({ life: adopted, catalog }).life;

    expect(ticked.pets[0].age).toBe(adopted.pets[0].age + 1);
  });
});
```

- [ ] **Step 3: Run tests and verify they fail**

Run:

```bash
npm run test -- src/__tests__/p1RomanceFamily.test.ts src/__tests__/p1Pets.test.ts
```

Expected: FAIL because modules do not exist.

- [ ] **Step 4: Implement `romanceFamily.ts`**

Create `src/domain/p1/romanceFamily.ts` with pure functions:

```ts
import type { GameCatalog } from "../../content/schema";
import type { LifeLogEntry, LifeState, Person } from "../types";
import { createRng } from "../rng";
import { ensureP1State } from "./defaultState";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

function newPerson(life: LifeState, relationType: Person["relationType"], name: string, age: number): Person {
  return {
    id: `${relationType}-${life.age}-${life.relationships.length + 1}`,
    name,
    age,
    relationType,
    relationship: 65,
    traits: [],
    alive: true
  };
}

export function startDating({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  if (ready.age < 16) throw new Error("activity.too_young");
  if (ready.relationships.some((person) => person.relationType === "lover" || person.relationType === "spouse")) {
    throw new Error("romance.already_partnered");
  }
  const rng = createRng(`${ready.seed}:p1:romance:date:${ready.age}`);
  const partner = newPerson(ready, "lover", rng.pick(["Alex", "Sam", "Jordan", "Taylor"]), Math.max(16, ready.age + rng.int(-3, 4)));
  const next = { ...ready, relationships: [...ready.relationships, partner] };
  const entry = log(next, "p1.log.romance.date", { partner: partner.name });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function proposeMarriage({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  const lover = ready.relationships.find((person) => person.relationType === "lover" && person.alive);
  if (!lover) throw new Error("romance.no_lover");
  const relationships = ready.relationships.map((person) => (person.id === lover.id ? { ...person, relationType: "spouse" as const, relationship: Math.min(100, person.relationship + 10) } : person));
  const next = { ...ready, relationships, cash: ready.cash - Math.min(ready.cash, 1000) };
  const entry = log(next, "p1.log.romance.marriage", { partner: lover.name });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function startPregnancy({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  if (!ready.relationships.some((person) => person.relationType === "spouse" && person.alive)) throw new Error("romance.no_spouse");
  if (ready.flags.includes("p1_pregnant")) throw new Error("romance.already_pregnant");
  const next = { ...ready, flags: [...ready.flags, "p1_pregnant", `p1_pregnancy_started_age_${ready.age}`] };
  const entry = log(next, "p1.log.family.pregnancy");
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function adoptChild({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  if (ready.age < 21) throw new Error("activity.too_young");
  if (ready.cash < 5000) throw new Error("activity.cash_too_low");
  const child = newPerson(ready, "child", "Riley", 0);
  const next = { ...ready, cash: ready.cash - 5000, relationships: [...ready.relationships, child] };
  const entry = log(next, "p1.log.family.adoption", { child: child.name });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function tickRomanceFamily({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  const startFlag = ready.flags.find((flag) => flag.startsWith("p1_pregnancy_started_age_"));
  if (!ready.flags.includes("p1_pregnant") || !startFlag) return { life: ready, logs: [] as LifeLogEntry[] };
  const startAge = Number(startFlag.replace("p1_pregnancy_started_age_", ""));
  if (ready.age - startAge < 1) return { life: ready, logs: [] as LifeLogEntry[] };
  const child = newPerson(ready, "child", "Morgan", 0);
  const flags = ready.flags.filter((flag) => flag !== "p1_pregnant" && !flag.startsWith("p1_pregnancy_started_age_"));
  const next = { ...ready, flags, relationships: [...ready.relationships, child] };
  const entry = log(next, "p1.log.family.birth", { child: child.name });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}
```

- [ ] **Step 5: Implement `pets.ts`**

Create `src/domain/p1/pets.ts`:

```ts
import type { GameCatalog } from "../../content/schema";
import { clampRelationship, clampStat } from "../clamp";
import { createRng } from "../rng";
import type { LifeLogEntry, LifeState, PetState } from "../types";
import { ensureP1State } from "./defaultState";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

export function adoptPet({ life, catalog, petId }: { life: LifeState; catalog: GameCatalog; petId: string }) {
  const ready = ensureP1State(life);
  const config = catalog.p1.pets.find((pet) => pet.id === petId);
  if (!config) throw new Error(`pet.missing:${petId}`);
  const rng = createRng(`${ready.seed}:p1:pet:adopt:${petId}:${ready.age}`);
  const price = rng.int(config.minPrice, config.maxPrice);
  if (ready.cash < price) throw new Error("activity.cash_too_low");
  const pet: PetState = {
    id: `pet-${ready.age}-${petId}-${rng.int(1000, 9999)}`,
    catalogId: petId,
    name: rng.pick(["Mimi", "Lucky", "Coco", "Pepper"]),
    age: 0,
    health: rng.int(60, 100),
    relationship: rng.int(35, 75),
    alive: true
  };
  const next = { ...ready, cash: ready.cash - price, pets: [...ready.pets, pet] };
  const entry = log(next, "p1.log.pet.adopt", { pet: pet.name, price });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function careForPet({ life, petInstanceId }: { life: LifeState; petInstanceId: string }) {
  const ready = ensureP1State(life);
  const pets = ready.pets.map((pet) =>
    pet.id === petInstanceId ? { ...pet, health: clampStat(pet.health + 8), relationship: clampRelationship(pet.relationship + 10) } : pet
  );
  const next = { ...ready, pets };
  const entry = log(next, "p1.log.pet.care", { petId: petInstanceId });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function tickPets({ life, catalog }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  const pets = ready.pets.map((pet) => {
    const config = catalog.p1.pets.find((item) => item.id === pet.catalogId);
    const nextAge = pet.age + 1;
    const alive = pet.alive && nextAge <= (config?.lifespan ?? 20);
    return { ...pet, age: nextAge, alive, health: alive ? clampStat(pet.health - 3) : 0 };
  });
  return { life: { ...ready, pets }, logs: [] as LifeLogEntry[] };
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1RomanceFamily.test.ts src/__tests__/p1Pets.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/p1/romanceFamily.ts src/domain/p1/pets.ts src/__tests__/p1RomanceFamily.test.ts src/__tests__/p1Pets.test.ts
git commit -m "feat: add p1 family and pets modules"
```

---

### Task 7: Crime, Justice, And Prison Modules

**Files:**
- Create: `src/domain/p1/crimeJustice.ts`
- Create: `src/domain/p1/prison.ts`
- Create: `src/__tests__/p1CrimePrison.test.ts`

- [ ] **Step 1: Write failing crime/prison tests**

Create `src/__tests__/p1CrimePrison.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { attemptCrime } from "../domain/p1/crimeJustice";
import { ensureP1State } from "../domain/p1/defaultState";
import { paroleAttempt, tickPrison } from "../domain/p1/prison";

describe("P1 crime and prison", () => {
  it("resolves a crime attempt into money or legal trouble", () => {
    const life = ensureP1State({ ...generateLife({ seed: "crime", catalog }), age: 25, cash: 1000 });
    const result = attemptCrime({ life, catalog, crimeId: "p1_crime_shoplifting" });

    expect(result.logs[0].messageKey.startsWith("p1.log.crime.")).toBe(true);
    expect(result.life.cash !== life.cash || result.life.legal.criminalRecord.length > 0).toBe(true);
  });

  it("puts convicted lives in prison with remaining sentence", () => {
    const life = ensureP1State({ ...generateLife({ seed: "crime-prison-1", catalog }), age: 25, cash: 1000, countryId: "us" });
    const result = attemptCrime({ life, catalog, crimeId: "p1_crime_bank_robbery", forceOutcome: "arrest" });

    expect(result.life.prison.inPrison).toBe(true);
    expect(result.life.prison.remainingYears).toBeGreaterThan(0);
  });

  it("ticks prison sentence down to release", () => {
    let life = ensureP1State({ ...generateLife({ seed: "prison-release", catalog }), age: 30 });
    life = { ...life, prison: { inPrison: true, sentenceYears: 1, remainingYears: 1, securityLevel: "minimum", behavior: 50, respect: 20 } };

    const result = tickPrison({ life: { ...life, age: 31 }, catalog });

    expect(result.life.prison.inPrison).toBe(false);
    expect(result.life.prison.remainingYears).toBe(0);
  });

  it("parole can reduce remaining sentence for good behavior", () => {
    const life = ensureP1State({ ...generateLife({ seed: "parole", catalog }), age: 30 });
    const prisoner = { ...life, prison: { inPrison: true, sentenceYears: 5, remainingYears: 3, securityLevel: "minimum" as const, behavior: 90, respect: 40 } };
    const result = paroleAttempt({ life: prisoner, catalog });

    expect(result.life.prison.remainingYears).toBeLessThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm run test -- src/__tests__/p1CrimePrison.test.ts
```

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement `crimeJustice.ts`**

Create `src/domain/p1/crimeJustice.ts`:

```ts
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
  const roll = rng.float();
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
```

- [ ] **Step 4: Implement `prison.ts`**

Create `src/domain/p1/prison.ts`:

```ts
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
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1CrimePrison.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/p1/crimeJustice.ts src/domain/p1/prison.ts src/__tests__/p1CrimePrison.test.ts
git commit -m "feat: add p1 crime and prison modules"
```

---

### Task 8: Travel, Migration, Fame, And Social Modules

**Files:**
- Create: `src/domain/p1/travelMigration.ts`
- Create: `src/domain/p1/fameSocial.ts`
- Create: `src/__tests__/p1TravelFameSocial.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/p1TravelFameSocial.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";
import { createSocialAccount, postToSocial, tickFameSocial, unlockFame } from "../domain/p1/fameSocial";
import { attemptEmigration, takeVacation } from "../domain/p1/travelMigration";

describe("P1 travel, migration, fame, and social", () => {
  it("records vacation travel without changing residence", () => {
    const life = ensureP1State({ ...generateLife({ seed: "vacation", catalog }), age: 25, cash: 10000, countryId: "us" });
    const result = takeVacation({ life, catalog, toCountryId: "jp" });

    expect(result.life.countryId).toBe("us");
    expect(result.life.migrationHistory.at(-1)?.method).toBe("travel");
  });

  it("can legally emigrate and change country", () => {
    const life = ensureP1State({ ...generateLife({ seed: "emigrate", catalog }), age: 30, cash: 50000, countryId: "us" });
    const result = attemptEmigration({ life, catalog, toCountryId: "jp", forceApproved: true });

    expect(result.life.countryId).toBe("jp");
    expect(result.life.migrationHistory.at(-1)?.method).toBe("legal_emigration");
  });

  it("unlocks fame and lets social posts change followers", () => {
    let life = ensureP1State({ ...generateLife({ seed: "fame", catalog }), age: 25, cash: 10000 });
    life = unlockFame({ life, source: "career.actor" }).life;
    life = createSocialAccount({ life, catalog, platformId: "p1_social_short_video" }).life;
    const posted = postToSocial({ life, catalog, accountId: life.socialAccounts[0].id }).life;

    expect(posted.fame.score).toBeGreaterThan(0);
    expect(posted.socialAccounts[0].followers).toBeGreaterThanOrEqual(life.socialAccounts[0].followers);
  });

  it("fame decays during yearly tick", () => {
    const famous = unlockFame({ life: ensureP1State({ ...generateLife({ seed: "fame-decay", catalog }), age: 30 }), source: "career.actor" }).life;
    const ticked = tickFameSocial({ life: { ...famous, age: 31 }, catalog }).life;

    expect(ticked.fame.score).toBeLessThanOrEqual(famous.fame.score);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- src/__tests__/p1TravelFameSocial.test.ts
```

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement travel/migration module**

Create `src/domain/p1/travelMigration.ts`:

```ts
import type { GameCatalog } from "../../content/schema";
import type { LifeLogEntry, LifeState, MigrationRecord } from "../types";
import { createRng } from "../rng";
import { countryLawFor } from "./countriesLaw";
import { ensureP1State } from "./defaultState";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

function appendMigration(life: LifeState, record: MigrationRecord): LifeState {
  const ready = ensureP1State(life);
  return { ...ready, migrationHistory: [...ready.migrationHistory, record] };
}

export function takeVacation({ life, toCountryId }: { life: LifeState; catalog: GameCatalog; toCountryId: string }) {
  const ready = ensureP1State(life);
  if (ready.cash < 1000) throw new Error("activity.cash_too_low");
  const next = appendMigration({ ...ready, cash: ready.cash - 1000 }, { age: ready.age, fromCountryId: ready.countryId, toCountryId, method: "travel", outcome: "completed" });
  const entry = log(next, "p1.log.travel.vacation", { toCountryId });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function attemptEmigration({ life, catalog, toCountryId, forceApproved }: { life: LifeState; catalog: GameCatalog; toCountryId: string; forceApproved?: boolean }) {
  const ready = ensureP1State(life);
  if (ready.cash < 5000) throw new Error("activity.cash_too_low");
  const law = countryLawFor({ ...ready, countryId: toCountryId }, catalog);
  const rng = createRng(`${ready.seed}:p1:emigrate:${ready.countryId}:${toCountryId}:${ready.age}`);
  const approved = forceApproved ?? rng.float() > law.immigrationDifficulty;
  const record: MigrationRecord = { age: ready.age, fromCountryId: ready.countryId, toCountryId, method: "legal_emigration", outcome: approved ? "approved" : "rejected" };
  const next = appendMigration({ ...ready, cash: ready.cash - 5000, countryId: approved ? toCountryId : ready.countryId }, record);
  const entry = log(next, approved ? "p1.log.migration.approved" : "p1.log.migration.rejected", { toCountryId });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}
```

- [ ] **Step 4: Implement fame/social module**

Create `src/domain/p1/fameSocial.ts`:

```ts
import type { GameCatalog } from "../../content/schema";
import { clampStat } from "../clamp";
import { createRng } from "../rng";
import type { LifeLogEntry, LifeState, SocialAccountState } from "../types";
import { ensureP1State } from "./defaultState";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

export function unlockFame({ life, source }: { life: LifeState; source: string }) {
  const ready = ensureP1State(life);
  const next = { ...ready, fame: { source, score: Math.max(10, ready.fame.score), publicSentiment: ready.fame.publicSentiment } };
  const entry = log(next, "p1.log.fame.unlock", { source });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function createSocialAccount({ life, catalog, platformId }: { life: LifeState; catalog: GameCatalog; platformId: string }) {
  const ready = ensureP1State(life);
  const platform = catalog.p1.socialPlatforms.find((item) => item.id === platformId);
  if (!platform) throw new Error(`social.platform_missing:${platformId}`);
  if (ready.age < platform.minAge) throw new Error("activity.too_young");
  const account: SocialAccountState = { id: `social-${platformId}-${ready.age}`, platformId, followers: 0, verified: false, monetized: false, banned: false };
  const next = { ...ready, socialAccounts: [...ready.socialAccounts, account] };
  const entry = log(next, "p1.log.social.create", { platformId });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function postToSocial({ life, accountId }: { life: LifeState; catalog: GameCatalog; accountId: string }) {
  const ready = ensureP1State(life);
  const account = ready.socialAccounts.find((item) => item.id === accountId);
  if (!account) throw new Error(`social.account_missing:${accountId}`);
  if (account.banned) throw new Error("social.account_banned");
  const rng = createRng(`${ready.seed}:p1:social:post:${accountId}:${ready.age}:${account.followers}`);
  const gain = rng.int(5, 250) + Math.round(ready.fame.score * 3);
  const socialAccounts = ready.socialAccounts.map((item) => item.id === accountId ? { ...item, followers: item.followers + gain } : item);
  const next = { ...ready, socialAccounts, fame: { ...ready.fame, score: clampStat(ready.fame.score + (gain > 100 ? 1 : 0)) } };
  const entry = log(next, "p1.log.social.post", { gain });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function tickFameSocial({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  const fame = { ...ready.fame, score: clampStat(ready.fame.score - (ready.fame.score > 0 ? 1 : 0)) };
  return { life: { ...ready, fame }, logs: [] as LifeLogEntry[] };
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1TravelFameSocial.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/p1/travelMigration.ts src/domain/p1/fameSocial.ts src/__tests__/p1TravelFameSocial.test.ts
git commit -m "feat: add p1 travel fame and social modules"
```

---

### Task 9: P1 Yearly Tick And Activity Dispatcher

**Files:**
- Create: `src/domain/p1/tick.ts`
- Create: `src/domain/p1/dispatch.ts`
- Create: `src/domain/p1/activities.ts`
- Modify: `src/domain/engine.ts`
- Create: `src/__tests__/p1EngineIntegration.test.ts`

- [ ] **Step 1: Write failing integration tests**

Create `src/__tests__/p1EngineIntegration.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { advanceYear, performActivity } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import { buyAsset } from "../domain/p1/assets";
import { ensureP1State } from "../domain/p1/defaultState";

describe("P1 engine integration", () => {
  it("age-up runs P1 ticks", () => {
    const life = buyAsset({
      life: ensureP1State({ ...generateLife({ seed: "p1-tick", catalog }), age: 18, cash: 200000 }),
      catalog,
      assetId: "used_hatchback"
    }).life;
    const before = life.assets.items[0].condition;
    const result = advanceYear({ life, catalog });

    expect(result.life.assets?.items[0].condition).toBeLessThanOrEqual(before);
  });

  it("performActivity dispatches P1 asset activity ids", () => {
    const life = ensureP1State({ ...generateLife({ seed: "p1-dispatch", catalog }), age: 18, cash: 200000 });
    const result = performActivity({ life, catalog, activityId: "p1_asset_buy_compact_apartment" });

    expect(result.life.assets?.items).toHaveLength(1);
  });

  it("prison disables ordinary activity ids", () => {
    const life = ensureP1State({ ...generateLife({ seed: "p1-prison-gate", catalog }), age: 30 });
    const prisoner = { ...life, prison: { inPrison: true, sentenceYears: 2, remainingYears: 2, securityLevel: "minimum" as const, behavior: 50, respect: 20 } };

    expect(() => performActivity({ life: prisoner, catalog, activityId: "exercise" })).toThrow(/prison.normal_activity_denied/);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- src/__tests__/p1EngineIntegration.test.ts
```

Expected: FAIL because P1 tick/dispatch is not wired.

- [ ] **Step 3: Implement `tick.ts`**

Create `src/domain/p1/tick.ts`:

```ts
import type { GameCatalog } from "../../content/schema";
import type { LifeLogEntry, LifeState } from "../types";
import { tickAssets } from "./assets";
import { ensureP1State } from "./defaultState";
import { tickFameSocial } from "./fameSocial";
import { tickPets } from "./pets";
import { tickPrison } from "./prison";
import { tickRomanceFamily } from "./romanceFamily";

export function tickP1Year({ life, catalog }: { life: LifeState; catalog: GameCatalog }): { life: LifeState; logs: LifeLogEntry[] } {
  let next = ensureP1State(life);
  const logs: LifeLogEntry[] = [];
  for (const tick of [tickRomanceFamily, tickAssets, tickPets, tickPrison, tickFameSocial]) {
    const result = tick({ life: next, catalog });
    next = result.life;
    logs.push(...result.logs);
  }
  return { life: next, logs };
}
```

- [ ] **Step 4: Implement dispatch helpers**

Create `src/domain/p1/dispatch.ts`:

```ts
import type { GameCatalog } from "../../content/schema";
import type { LifeLogEntry, LifeState } from "../types";
import { buyAsset } from "./assets";
import { ensureP1State } from "./defaultState";

export function isP1Activity(activityId: string): boolean {
  return activityId.startsWith("p1_");
}

export function dispatchP1Activity({ life, catalog, activityId }: { life: LifeState; catalog: GameCatalog; activityId: string }): { life: LifeState; logs: LifeLogEntry[] } {
  const ready = ensureP1State(life);
  if (ready.prison.inPrison && !activityId.startsWith("p1_prison_")) {
    throw new Error("prison.normal_activity_denied");
  }
  if (activityId === "p1_asset_buy_compact_apartment") {
    return buyAsset({ life: ready, catalog, assetId: "compact_apartment" });
  }
  throw new Error(`p1.activity_missing:${activityId}`);
}
```

Create `src/domain/p1/activities.ts` to hold future P1 id mapping:

```ts
export const p1ActivityIds = ["p1_asset_buy_compact_apartment"] as const;
export type P1ActivityId = (typeof p1ActivityIds)[number];
```

- [ ] **Step 5: Wire engine**

Modify `src/domain/engine.ts`:

- Import `ensureP1State`, `tickP1Year`, `dispatchP1Activity`, and `isP1Activity`.
- At the start of `advanceYear`, clone `ensureP1State(life)` instead of `life`.
- After base disease/relationship progression and before event selection, call `tickP1Year`.
- At the start of `performActivity`, if `isP1Activity(activityId)` return `dispatchP1Activity`.
- If `life.prison?.inPrison` and activity id is a P0 activity, throw `prison.normal_activity_denied`.

- [ ] **Step 6: Run integration tests**

Run:

```bash
npm run test -- src/__tests__/p1EngineIntegration.test.ts src/__tests__/engine.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/engine.ts src/domain/p1/tick.ts src/domain/p1/dispatch.ts src/domain/p1/activities.ts src/__tests__/p1EngineIntegration.test.ts
git commit -m "feat: wire p1 modules into engine"
```

---

### Task 10: Activity Availability And UI Grouping

**Files:**
- Create: `src/domain/p1/activityCatalog.ts`
- Modify: `src/views/ActivitiesView.tsx`
- Modify: `src/i18n.ts`
- Create: `src/__tests__/p1ActivityUi.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Create `src/__tests__/p1ActivityUi.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";
import { ActivitiesView } from "../views/ActivitiesView";

describe("P1 activity UI", () => {
  it("shows P1 activity groups without replacing existing groups", () => {
    const life = ensureP1State({ ...generateLife({ seed: "ui-p1-activities", catalog }), age: 25, cash: 200000 });

    render(<ActivitiesView life={life} locale="zh-CN" onActivity={() => undefined} />);

    expect(screen.getByText("资产")).toBeInTheDocument();
    expect(screen.getByText("犯罪")).toBeInTheDocument();
    expect(screen.getByText("宠物")).toBeInTheDocument();
    expect(screen.getByText("身心")).toBeInTheDocument();
  });

  it("calls onActivity with a P1 activity id", async () => {
    const user = userEvent.setup();
    const onActivity = vi.fn();
    const life = ensureP1State({ ...generateLife({ seed: "ui-p1-click", catalog }), age: 25, cash: 200000 });

    render(<ActivitiesView life={life} locale="zh-CN" onActivity={onActivity} />);
    await user.click(screen.getByRole("button", { name: /紧凑公寓/ }));

    expect(onActivity).toHaveBeenCalledWith("p1_asset_buy_compact_apartment");
  });
});
```

- [ ] **Step 2: Run UI tests and verify failure**

Run:

```bash
npm run test -- src/__tests__/p1ActivityUi.test.tsx
```

Expected: FAIL because P1 activity groups are not rendered.

- [ ] **Step 3: Create P1 activity view model**

Create `src/domain/p1/activityCatalog.ts` with a function `availableP1Activities(life, catalog)` returning cards:

```ts
import type { GameCatalog } from "../../content/schema";
import type { LifeState } from "../types";
import { ensureP1State } from "./defaultState";

export interface P1ActivityCard {
  id: string;
  group: "assets" | "crime" | "law_prison" | "fame" | "social" | "pets" | "travel_migration" | "romance_family";
  labelKey: string;
  disabled: boolean;
  reasonKey?: string;
  cost?: number;
}

export function availableP1Activities(life: LifeState, catalog: GameCatalog): P1ActivityCard[] {
  const ready = ensureP1State(life);
  const cards: P1ActivityCard[] = [];
  for (const asset of catalog.p1.assets) {
    cards.push({
      id: `p1_asset_buy_${asset.id}`,
      group: "assets",
      labelKey: asset.nameKey,
      disabled: ready.age < (asset.requirements.minAge ?? 0),
      reasonKey: ready.age < (asset.requirements.minAge ?? 0) ? "availableAt" : undefined,
      cost: asset.minPrice
    });
  }
  return cards;
}
```

- [ ] **Step 4: Update `ActivitiesView.tsx`**

Modify `src/views/ActivitiesView.tsx` to merge `catalog.activities` with `availableP1Activities(life, catalog)`. Add group labels:

```ts
const p1GroupLabelKeys = {
  assets: "groupAssets",
  crime: "groupCrime",
  law_prison: "groupLawPrison",
  fame: "groupFame",
  social: "groupSocial",
  pets: "groupPets",
  travel_migration: "groupTravelMigration",
  romance_family: "groupRomanceFamily"
} as const;
```

Render P1 cards as buttons with `contentLabel(locale, card.labelKey)`.

- [ ] **Step 5: Add UI locale labels**

Modify `src/i18n.ts` to include:

```ts
groupAssets: "资产",
groupCrime: "犯罪",
groupLawPrison: "法律与监狱",
groupFame: "名声",
groupSocial: "社交媒体",
groupPets: "宠物",
groupTravelMigration: "移民旅行",
groupRomanceFamily: "爱情家庭"
```

Add matching English strings.

- [ ] **Step 6: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1ActivityUi.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/p1/activityCatalog.ts src/views/ActivitiesView.tsx src/i18n.ts src/__tests__/p1ActivityUi.test.tsx
git commit -m "feat: show p1 activity groups"
```

---

### Task 11: P1 Life, Relationship, Career, And Tombstone UI

**Files:**
- Modify: `src/views/LifeView.tsx`
- Modify: `src/views/RelationshipsView.tsx`
- Modify: `src/views/CareerView.tsx`
- Modify: `src/views/TombstoneView.tsx`
- Modify: `src/i18n.ts`
- Create: `src/__tests__/p1StatusViews.test.tsx`

- [ ] **Step 1: Write failing status view tests**

Create `src/__tests__/p1StatusViews.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { buyAsset } from "../domain/p1/assets";
import { ensureP1State } from "../domain/p1/defaultState";
import { adoptPet } from "../domain/p1/pets";
import { LifeView } from "../views/LifeView";
import { RelationshipsView } from "../views/RelationshipsView";

describe("P1 status views", () => {
  it("shows net worth and P1 summary in life view", () => {
    const life = buyAsset({
      life: ensureP1State({ ...generateLife({ seed: "status-life", catalog }), age: 25, cash: 200000 }),
      catalog,
      assetId: "compact_apartment"
    }).life;

    render(<LifeView life={life} locale="zh-CN" onStart={() => undefined} />);

    expect(screen.getByText(/净资产/)).toBeInTheDocument();
    expect(screen.getByText(/资产/)).toBeInTheDocument();
  });

  it("groups pets in relationships view", () => {
    const life = adoptPet({
      life: ensureP1State({ ...generateLife({ seed: "status-pet", catalog }), age: 25, cash: 5000 }),
      catalog,
      petId: "p1_pet_cat"
    }).life;

    render(<RelationshipsView life={life} locale="zh-CN" />);

    expect(screen.getByText("宠物")).toBeInTheDocument();
    expect(screen.getByText("Mimi")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- src/__tests__/p1StatusViews.test.tsx
```

Expected: FAIL because P1 summaries are not visible.

- [ ] **Step 3: Add P1 life summary**

Modify `src/views/LifeView.tsx` to show:

- net worth: cash + asset current values.
- asset count.
- legal/prison status.
- pet count.
- fame score if above zero.

- [ ] **Step 4: Add P1 relationship groups**

Modify `src/views/RelationshipsView.tsx` to render human relationships and pets in separate sections. Keep existing behavior when `life.pets` is empty.

- [ ] **Step 5: Add fame/social summary to career view**

Modify `src/views/CareerView.tsx` to show fame score, public sentiment, and social account count when present.

- [ ] **Step 6: Add P1 tombstone summary**

Modify `src/views/TombstoneView.tsx` to show net worth, asset count, children count, pet count, prison years, and fame score when available.

- [ ] **Step 7: Add locale keys**

Modify `src/i18n.ts` with Chinese and English labels for:

```text
netWorthLabel
assetCountLabel
legalStatusLabel
prisonStatusLabel
petCountLabel
fameScoreLabel
socialAccountCountLabel
childrenCountLabel
prisonYearsLabel
```

- [ ] **Step 8: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1StatusViews.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/views/LifeView.tsx src/views/RelationshipsView.tsx src/views/CareerView.tsx src/views/TombstoneView.tsx src/i18n.ts src/__tests__/p1StatusViews.test.tsx
git commit -m "feat: show p1 status summaries"
```

---

### Task 12: P1 Tombstone And Backend Bounds

**Files:**
- Modify: `src/domain/scoring.ts`
- Modify: `src/api/tombstonesClient.ts`
- Modify: `netlify/functions/lib/tombstoneSchema.ts`
- Create: `src/domain/p1/summary.ts`
- Create: `src/__tests__/p1TombstoneSummary.test.ts`

- [ ] **Step 1: Write failing tombstone tests**

Create `src/__tests__/p1TombstoneSummary.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { buyAsset } from "../domain/p1/assets";
import { ensureP1State } from "../domain/p1/defaultState";
import { buildP1PublicSummary } from "../domain/p1/summary";
import { buildDeathSummary } from "../domain/scoring";

describe("P1 tombstone summary", () => {
  it("summarizes public P1 outcome fields", () => {
    const life = buyAsset({
      life: ensureP1State({ ...generateLife({ seed: "p1-summary", catalog }), age: 80, cash: 200000 }),
      catalog,
      assetId: "compact_apartment"
    }).life;

    const summary = buildP1PublicSummary(life);

    expect(summary.assetCount).toBe(1);
    expect(summary.netWorth).toBeGreaterThan(life.cash);
  });

  it("death summary can include P1 net worth in score context", () => {
    const life = ensureP1State({ ...generateLife({ seed: "p1-death", catalog }), age: 90, alive: false, cash: 10000 });
    const death = buildDeathSummary({ life, catalog, causeOfDeath: "old_age" });

    expect(death.netWorth).toBeGreaterThanOrEqual(10000);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- src/__tests__/p1TombstoneSummary.test.ts src/__tests__/tombstoneClient.test.ts
```

Expected: FAIL because `buildP1PublicSummary` does not exist and backend schema does not accept P1 fields.

- [ ] **Step 3: Add P1 public summary builder**

Create `src/domain/p1/summary.ts`:

```ts
import type { LifeState } from "../types";
import { ensureP1State } from "./defaultState";

export interface P1PublicSummary {
  netWorth: number;
  assetCount: number;
  childrenCount: number;
  petCount: number;
  prisonYears: number;
  fameScore: number;
  countriesLived: number;
}

export function buildP1PublicSummary(life: LifeState): P1PublicSummary {
  const ready = ensureP1State(life);
  const assetValue = ready.assets.items.reduce((sum, asset) => sum + asset.currentValue - asset.debt, 0);
  const countries = new Set([ready.countryId, ...ready.migrationHistory.map((item) => item.toCountryId)]);
  return {
    netWorth: ready.cash + assetValue,
    assetCount: ready.assets.items.length,
    childrenCount: ready.relationships.filter((person) => person.relationType === "child").length,
    petCount: ready.pets.filter((pet) => pet.alive).length,
    prisonYears: ready.legal.criminalRecord.reduce((sum, record) => sum + record.sentenceYears, 0),
    fameScore: ready.fame.score,
    countriesLived: countries.size
  };
}
```

- [ ] **Step 4: Extend scoring**

Modify `src/domain/scoring.ts` so net worth includes asset value via `buildP1PublicSummary(life).netWorth`.

- [ ] **Step 5: Extend tombstone client and function schema**

Modify `src/api/tombstonesClient.ts` and `netlify/functions/lib/tombstoneSchema.ts` to include bounded optional P1 fields:

```ts
p1: z.object({
  netWorth: z.number().int().min(-1_000_000_000).max(10_000_000_000),
  assetCount: z.number().int().min(0).max(500),
  childrenCount: z.number().int().min(0).max(200),
  petCount: z.number().int().min(0).max(100),
  prisonYears: z.number().int().min(0).max(500),
  fameScore: z.number().int().min(0).max(100),
  countriesLived: z.number().int().min(1).max(200)
}).optional()
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm run test -- src/__tests__/p1TombstoneSummary.test.ts src/__tests__/tombstoneClient.test.ts src/__tests__/tombstoneScore.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/scoring.ts src/domain/p1/summary.ts src/api/tombstonesClient.ts netlify/functions/lib/tombstoneSchema.ts src/__tests__/p1TombstoneSummary.test.ts
git commit -m "feat: add p1 tombstone summary fields"
```

---

### Task 13: Fixed-Seed P1 Simulation And Catalog Heavy Validation

**Files:**
- Create: `src/__tests__/p1Simulation.test.ts`
- Modify: `src/content/p1/validation.ts`

- [ ] **Step 1: Add fixed-seed simulation tests**

Create `src/__tests__/p1Simulation.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { validateP1Catalog } from "../content/p1/validation";
import { advanceYear, performActivity } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";

describe("P1 fixed-seed simulations", () => {
  it("runs a long ordinary life with P1 state without uncaught errors", () => {
    let life = ensureP1State({ ...generateLife({ seed: "p1-long-life", catalog }), cash: 200000 });

    for (let year = 0; year < 60 && life.alive; year += 1) {
      if (life.age === 18) {
        life = performActivity({ life, catalog, activityId: "p1_asset_buy_compact_apartment" }).life;
      }
      life = advanceYear({ life: { ...life, pendingEventId: undefined }, catalog }).life;
    }

    expect(life.age).toBeGreaterThanOrEqual(60);
    expect(life.assets).toBeDefined();
    expect(life.legal).toBeDefined();
    expect(life.pets).toBeDefined();
  });

  it("validates generated P1 content with heavy rules", () => {
    expect(() => validateP1Catalog(catalog.p1)).not.toThrow();
  });
});
```

- [ ] **Step 2: Strengthen validation**

Modify `src/content/p1/validation.ts` to add:

- numeric upper/lower checks for generated arrays.
- `source` prefix check requiring `generated:p1:`.
- unfinished-marker scan for common placeholder tokens used by unfinished generated content.
- repeated visible value detection inside each locale.

- [ ] **Step 3: Run simulation and catalog tests**

Run:

```bash
npm run test -- src/__tests__/p1Simulation.test.ts src/__tests__/p1CatalogValidation.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/content/p1/validation.ts src/__tests__/p1Simulation.test.ts
git commit -m "test: add p1 simulation validation"
```

---

### Task 14: Mobile E2E Smoke Flows

**Files:**
- Create: `e2e/p1-smoke.spec.ts`
- Modify: `playwright.config.ts` only if the existing web server config cannot run the new test

- [ ] **Step 1: Add P1 smoke test**

Create `e2e/p1-smoke.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("P1 mobile flow reaches asset and tombstone surfaces", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /菜单|Menu/ }).click();
  await page.getByRole("menuitem", { name: /新人生|New Life/ }).click();

  for (let index = 0; index < 18; index += 1) {
    const ageButton = page.getByRole("button", { name: /年龄|Age|岁/ });
    if (await ageButton.isEnabled()) {
      await ageButton.click();
    }
    const choices = page.locator(".event-panel button");
    if ((await choices.count()) > 0) {
      await choices.first().click();
    }
  }

  await page.getByRole("button", { name: /活动|Activities/ }).click();
  await expect(page.getByText(/资产|Assets/)).toBeVisible();
  await expect(page.getByText(/犯罪|Crime/)).toBeVisible();
  await expect(page.getByText(/宠物|Pets/)).toBeVisible();
});
```

- [ ] **Step 2: Run E2E test**

Run:

```bash
npm run test:e2e -- e2e/p1-smoke.spec.ts
```

Expected: PASS. If Playwright browsers are missing, run `npx playwright install` and rerun.

- [ ] **Step 3: Commit**

```bash
git add e2e/p1-smoke.spec.ts playwright.config.ts
git commit -m "test: add p1 mobile smoke flow"
```

---

### Task 15: Full Verification And Documentation Update

**Files:**
- Modify: `README.md`
- Modify: `docs/design/bitlife-feature-matrix.md` only if adding implementation status notes

- [ ] **Step 1: Update README P1 section**

Append to `README.md`:

```md
## P1 Expansion

The P1 expansion keeps the app local-first and adds modular systems for assets, romance/family, crime, justice/prison, country law, fame/social media, pets, and travel/migration.

Generated P1 content is validated before runtime. The validation covers schema shape, bilingual locale coverage, id references, numeric bounds, state reachability, and forbidden reference expressions.
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run test
npm run build
npm run test:e2e
```

Expected:

- `npm run test`: PASS.
- `npm run build`: PASS.
- `npm run test:e2e`: PASS.

- [ ] **Step 3: Check git status for unrelated duplicate files**

Run:

```bash
git status --short
```

Expected: only intended modified/tracked files from this task plus pre-existing unrelated untracked duplicate files. Do not stage duplicate ` 2` or ` 3` files.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/design/bitlife-feature-matrix.md
git commit -m "docs: document p1 expansion"
```

If `docs/design/bitlife-feature-matrix.md` was not changed, commit only `README.md`:

```bash
git add README.md
git commit -m "docs: document p1 expansion"
```

---

## Self-Review

### Spec Coverage

- Assets: Task 5, Task 10, Task 11, Task 12, Task 13.
- Romance/family: Task 6, Task 10, Task 11, Task 13.
- Crime/justice/prison: Task 7, Task 9, Task 10, Task 11, Task 13.
- Countries/law: Task 4, Task 8, Task 9, Task 13.
- Fame/social: Task 8, Task 10, Task 11, Task 13.
- Pets: Task 6, Task 10, Task 11, Task 13.
- Travel/migration: Task 8, Task 10, Task 13.
- Generated content pipeline: Task 2, Task 3, Task 13.
- Bilingual validation: Task 2, Task 13.
- Local-first backend scope: Task 12 keeps backend bounded to tombstones.
- UI strategy: Task 10 and Task 11.
- E2E validation: Task 14.

### Placeholder Scan

This plan intentionally avoids open-ended placeholders in implementation steps. Future generated content volume is handled by concrete generator and validation tasks rather than unspecified manual fill-in work.

### Type Consistency

The plan consistently uses:

- `ensureP1State(life)` from `src/domain/p1/defaultState.ts`.
- `catalog.p1` for P1 catalog data.
- `LifeState.assets.items`, `LifeState.legal`, `LifeState.prison`, `LifeState.fame`, `LifeState.socialAccounts`, `LifeState.pets`, and `LifeState.migrationHistory`.
- Domain functions returning `{ life, logs }`.

### Execution Note

This plan is intentionally broad because the approved spec is a single large P1 version. During execution, prefer one fresh subagent per task and review each task before starting the next.
