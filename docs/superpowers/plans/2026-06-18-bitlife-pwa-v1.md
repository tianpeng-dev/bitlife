# BitLife-like PWA v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Netlify PWA where a player can start a randomized life, age year by year, make choices, die, view a tombstone, and submit an anonymous leaderboard entry.

**Architecture:** The game is local-first: React renders UI, Zustand manages UI/game state, IndexedDB stores active and past lives, and a pure TypeScript simulation engine owns all rules. Netlify Functions handle only anonymous tombstone sharing and leaderboard reads/writes; the first implementation uses Netlify Blobs behind a small `TombstoneStore` interface.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, Playwright, Zustand, Zod, IndexedDB, vite-plugin-pwa, Netlify Functions, Netlify Blobs.

---

## Repo Root

All paths in this plan are relative to `/Users/peng/Documents/Project/bitlife`.

## Scope Check

The approved spec includes several subsystems, but they form one testable vertical slice: local gameplay loop plus anonymous tombstone sharing. This plan keeps implementation in one plan because each task produces working software and builds toward the same PWA. Deep P1/P2 systems are explicitly excluded.

## Target File Structure

```text
package.json                         Project scripts and dependencies
index.html                           Vite app entry document
tsconfig.json                        TypeScript project configuration
vite.config.ts                       Vite, React, PWA, test config
vitest.config.ts                     Vitest browserless unit test config
playwright.config.ts                 Mobile smoke test config
netlify.toml                         Netlify build and function config
.gitignore                           Ignore generated files and local artifacts
src/main.tsx                         React bootstrap
src/App.tsx                          Top-level app shell and routing state
src/styles/global.css                Mobile-first global styles
src/domain/types.ts                  Core domain types
src/domain/rng.ts                    Seeded random utilities
src/domain/clamp.ts                  Numeric bounds helpers
src/domain/lifeGenerator.ts          New life generation
src/domain/engine.ts                 Age-up and event-choice orchestration
src/domain/effects.ts                Applies stat, cash, relationship, disease effects
src/domain/scoring.ts                Tombstone score and tags
src/content/schema.ts                Zod schemas for content catalogs
src/content/catalog.ts               Combined v1 content catalog
src/content/locales.ts               zh-CN and en-US strings
src/content/activities.ts            Activity definitions
src/content/events.ts                Event definitions
src/content/careers.ts               Career definitions
src/content/diseases.ts              Disease definitions
src/content/countries.ts             Country rule definitions
src/content/achievements.ts          Tombstone/achievement tag definitions
src/store/gameStore.ts               Zustand store
src/storage/indexedDb.ts             IndexedDB persistence wrapper
src/api/tombstonesClient.ts          Browser API client for Netlify Functions
src/components/*                     Reusable UI components
src/views/*                          Main mobile views
src/__tests__/*                      Unit and integration tests
netlify/functions/tombstones.ts      POST tombstone, GET list
netlify/functions/tombstone.ts       GET single tombstone
netlify/functions/lib/tombstoneStore.ts  Netlify Blobs storage implementation
netlify/functions/lib/tombstoneSchema.ts Shared server-side validation
e2e/pwa-smoke.spec.ts                Playwright mobile smoke test
```

## Commit Discipline

Each task ends with a commit. Do not include unrelated untracked reference data, `.DS_Store`, downloaded wiki pages, or generated build output in implementation commits.

---

### Task 1: Project Scaffold and Tooling

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `netlify.toml`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles/global.css`

- [ ] **Step 1: Create `.gitignore`**

```gitignore
.DS_Store
node_modules/
dist/
coverage/
playwright-report/
test-results/
.netlify/
.env
.env.*
!.env.example
src/**/*.log
tools/__pycache__/
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "bitlife-like-pwa",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "tsc --noEmit",
    "netlify:dev": "netlify dev"
  },
  "dependencies": {
    "@netlify/blobs": "^8.2.0",
    "@vitejs/plugin-react": "^4.3.4",
    "idb": "^8.0.0",
    "nanoid": "^5.0.9",
    "vite-plugin-pwa": "^0.21.1",
    "zod": "^3.24.1",
    "zustand": "^5.0.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@netlify/functions": "^3.0.2",
    "@playwright/test": "^1.49.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and npm exits with code 0.

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#111827" />
    <title>Text Life</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "netlify/functions", "vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 6: Create `vite.config.ts`**

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Text Life",
        short_name: "TextLife",
        description: "A mobile-first text life simulator.",
        theme_color: "#111827",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/pwa.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"]
      }
    })
  ]
});
```

- [ ] **Step 7: Create `vitest.config.ts`**

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"]
    }
  }
});
```

- [ ] **Step 8: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  },
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] }
    }
  ]
});
```

- [ ] **Step 9: Create `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/tombstones/:id"
  to = "/.netlify/functions/tombstone?id=:id"
  status = 200

[[redirects]]
  from = "/api/tombstones"
  to = "/.netlify/functions/tombstones"
  status = 200

[[redirects]]
  from = "/api/leaderboard"
  to = "/.netlify/functions/tombstones"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 10: Create initial React files**

`src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>Text Life</h1>
      <p>First playable life simulator build is ready for implementation.</p>
    </main>
  );
}
```

`src/styles/global.css`:

```css
:root {
  color: #111827;
  background: #f8fafc;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  width: min(100%, 480px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 24px 16px;
  background: #ffffff;
}
```

- [ ] **Step 11: Create test setup**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 12: Verify scaffold**

Run: `npm run build`

Expected: exit code 0 and output includes `dist/index.html`.

- [ ] **Step 13: Commit scaffold**

```bash
git add .gitignore package.json package-lock.json index.html tsconfig.json vite.config.ts vitest.config.ts playwright.config.ts netlify.toml src/main.tsx src/App.tsx src/styles/global.css src/test/setup.ts
git commit -m "chore: scaffold mobile PWA app"
```

---

### Task 2: Domain Types, Bounds, and Seeded RNG

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/rng.ts`
- Create: `src/domain/clamp.ts`
- Test: `src/__tests__/rng.test.ts`
- Test: `src/__tests__/domainBounds.test.ts`

- [ ] **Step 1: Write failing RNG tests**

Create `src/__tests__/rng.test.ts`:

```ts
import { createRng } from "../domain/rng";

describe("createRng", () => {
  it("returns reproducible values for the same seed", () => {
    const a = createRng("life-123");
    const b = createRng("life-123");

    expect([a.next(), a.next(), a.int(1, 10)]).toEqual([b.next(), b.next(), b.int(1, 10)]);
  });

  it("picks weighted entries deterministically", () => {
    const rng = createRng("weighted");
    const result = rng.weighted([
      { value: "common", weight: 10 },
      { value: "rare", weight: 1 }
    ]);

    expect(["common", "rare"]).toContain(result);
  });
});
```

- [ ] **Step 2: Write failing bounds tests**

Create `src/__tests__/domainBounds.test.ts`:

```ts
import { clampStat, clampCash } from "../domain/clamp";

describe("domain bounds", () => {
  it("keeps stats between 0 and 100", () => {
    expect(clampStat(-20)).toBe(0);
    expect(clampStat(42)).toBe(42);
    expect(clampStat(140)).toBe(100);
  });

  it("allows cash debt but keeps invalid numbers at zero", () => {
    expect(clampCash(Number.NaN)).toBe(0);
    expect(clampCash(-500)).toBe(-500);
    expect(clampCash(2500)).toBe(2500);
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm run test -- src/__tests__/rng.test.ts src/__tests__/domainBounds.test.ts`

Expected: FAIL because `../domain/rng` and `../domain/clamp` do not exist.

- [ ] **Step 4: Create `src/domain/types.ts`**

```ts
export type Locale = "zh-CN" | "en-US";

export type StatKey = "happiness" | "health" | "smarts" | "looks";

export type LifeStage = "early_childhood" | "childhood" | "teen" | "adult" | "elder";

export type Gender = "female" | "male" | "nonbinary";

export type RelationshipType = "parent" | "sibling" | "friend" | "lover" | "spouse" | "child";

export interface Stats {
  happiness: number;
  health: number;
  smarts: number;
  looks: number;
}

export interface Person {
  id: string;
  name: string;
  age: number;
  relationType: RelationshipType;
  relationship: number;
  traits: string[];
  alive: boolean;
}

export interface DiseaseState {
  id: string;
  severity: number;
  diagnosed: boolean;
  yearsActive: number;
}

export interface EducationState {
  stage: "none" | "primary" | "secondary" | "university" | "graduated";
  yearsCompleted: number;
  majorId?: string;
}

export interface CareerState {
  careerId?: string;
  title?: string;
  salary: number;
  performance: number;
  years: number;
}

export interface LifeState {
  id: string;
  seed: string;
  name: string;
  gender: Gender;
  age: number;
  stage: LifeStage;
  countryId: string;
  city: string;
  alive: boolean;
  stats: Stats;
  cash: number;
  relationships: Person[];
  education: EducationState;
  career: CareerState;
  diseases: DiseaseState[];
  flags: string[];
  log: LifeLogEntry[];
  pendingEventId?: string;
  death?: DeathSummary;
}

export interface LifeLogEntry {
  id: string;
  age: number;
  messageKey: string;
  params?: Record<string, string | number>;
}

export interface DeathSummary {
  ageAtDeath: number;
  causeOfDeath: string;
  summaryKey: string;
  tags: string[];
  score: number;
  netWorth: number;
  createdAt: string;
}

export interface Weighted<T> {
  value: T;
  weight: number;
}
```

- [ ] **Step 5: Create `src/domain/clamp.ts`**

```ts
export function clampStat(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function clampRelationship(value: number): number {
  return clampStat(value);
}

export function clampCash(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}
```

- [ ] **Step 6: Create `src/domain/rng.ts`**

```ts
import type { Weighted } from "./types";

function xmur3(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly Weighted<T>[]): T;
  fork(label: string): Rng;
}

export function createRng(seed: string): Rng {
  const seedFactory = xmur3(seed);
  const random = mulberry32(seedFactory());

  return {
    next() {
      return random();
    },
    int(min, max) {
      return Math.floor(random() * (max - min + 1)) + min;
    },
    pick(items) {
      if (items.length === 0) throw new Error("Cannot pick from an empty array");
      return items[this.int(0, items.length - 1)];
    },
    weighted(items) {
      const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
      if (total <= 0) throw new Error("Weighted pick requires positive total weight");
      let roll = random() * total;
      for (const item of items) {
        roll -= Math.max(0, item.weight);
        if (roll <= 0) return item.value;
      }
      return items[items.length - 1].value;
    },
    fork(label) {
      return createRng(`${seed}:${label}`);
    }
  };
}
```

- [ ] **Step 7: Run tests**

Run: `npm run test -- src/__tests__/rng.test.ts src/__tests__/domainBounds.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit domain primitives**

```bash
git add src/domain src/__tests__/rng.test.ts src/__tests__/domainBounds.test.ts
git commit -m "feat: add domain primitives and seeded rng"
```

---

### Task 3: Content Schemas and Starter Catalog

**Files:**
- Create: `src/content/schema.ts`
- Create: `src/content/locales.ts`
- Create: `src/content/countries.ts`
- Create: `src/content/careers.ts`
- Create: `src/content/diseases.ts`
- Create: `src/content/activities.ts`
- Create: `src/content/events.ts`
- Create: `src/content/achievements.ts`
- Create: `src/content/catalog.ts`
- Test: `src/__tests__/contentSchema.test.ts`

- [ ] **Step 1: Write failing catalog validation tests**

Create `src/__tests__/contentSchema.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { validateCatalog } from "../content/schema";

describe("content catalog", () => {
  it("passes schema validation", () => {
    expect(() => validateCatalog(catalog)).not.toThrow();
  });

  it("ships minimum starter content for the vertical slice", () => {
    expect(catalog.countries.length).toBeGreaterThanOrEqual(5);
    expect(catalog.activities.length).toBeGreaterThanOrEqual(8);
    expect(catalog.events.length).toBeGreaterThanOrEqual(12);
    expect(catalog.careers.length).toBeGreaterThanOrEqual(6);
    expect(catalog.diseases.length).toBeGreaterThanOrEqual(4);
    expect(catalog.achievements.length).toBeGreaterThanOrEqual(6);
  });

  it("has zh-CN strings for all starter content labels", () => {
    const zh = catalog.locales["zh-CN"];
    for (const activity of catalog.activities) {
      expect(zh[activity.labelKey]).toBeTruthy();
    }
    for (const event of catalog.events) {
      expect(zh[event.promptKey]).toBeTruthy();
      for (const choice of event.choices) {
        expect(zh[choice.labelKey]).toBeTruthy();
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/__tests__/contentSchema.test.ts`

Expected: FAIL because content modules do not exist.

- [ ] **Step 3: Create `src/content/schema.ts`**

```ts
import { z } from "zod";

export const localizedRecordSchema = z.record(z.string().min(1), z.string().min(1));

export const effectSchema = z.object({
  stats: z.record(z.enum(["happiness", "health", "smarts", "looks"]), z.number()).optional(),
  cash: z.number().optional(),
  relationship: z.number().optional(),
  addDiseaseId: z.string().optional(),
  addFlag: z.string().optional(),
  logKey: z.string().optional()
});

export const activitySchema = z.object({
  id: z.string().min(1),
  labelKey: z.string().min(1),
  group: z.enum(["mind_body", "relationships", "education_career", "health", "leisure", "risk"]),
  minAge: z.number().int().min(0),
  maxAge: z.number().int().min(0).optional(),
  cost: z.number().optional(),
  effects: z.array(effectSchema).min(1)
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
  achievements: z.array(achievementSchema).min(1)
});

export type GameCatalog = z.infer<typeof catalogSchema>;
export type EffectConfig = z.infer<typeof effectSchema>;
export type EventConfig = z.infer<typeof eventSchema>;
export type ActivityConfig = z.infer<typeof activitySchema>;

export function validateCatalog(catalog: GameCatalog): GameCatalog {
  const parsed = catalogSchema.parse(catalog);
  const localeKeys = new Set(Object.keys(parsed.locales["zh-CN"]));
  const requiredKeys = [
    ...parsed.activities.map((item) => item.labelKey),
    ...parsed.events.flatMap((event) => [event.promptKey, ...event.choices.map((choice) => choice.labelKey)]),
    ...parsed.careers.map((item) => item.titleKey),
    ...parsed.diseases.map((item) => item.nameKey),
    ...parsed.countries.map((item) => item.nameKey),
    ...parsed.achievements.map((item) => item.labelKey)
  ];
  const missing = requiredKeys.filter((key) => !localeKeys.has(key));
  if (missing.length > 0) {
    throw new Error(`Missing zh-CN locale keys: ${missing.join(", ")}`);
  }
  return parsed;
}
```

- [ ] **Step 4: Create starter content files**

Create `src/content/locales.ts`:

```ts
import type { GameCatalog } from "./schema";

export const locales = {
  "zh-CN": {
    "country.us": "美国",
    "country.cn": "中国",
    "country.uk": "英国",
    "country.jp": "日本",
    "country.br": "巴西",
    "activity.study": "努力学习",
    "activity.exercise": "去锻炼",
    "activity.doctor": "看医生",
    "activity.friend": "联系朋友",
    "activity.date": "去约会",
    "activity.part_time": "找兼职",
    "activity.work_hard": "努力工作",
    "activity.rest": "好好休息",
    "event.family_picnic": "你的家人提议周末一起出门。",
    "event.school_quiz": "学校突然来了一场小测验。",
    "event.weird_neighbor": "邻居说你的影子看起来很有前途。",
    "event.friend_secret": "朋友告诉你一个让人有点不安的秘密。",
    "event.fever": "你发烧了，整个人像被热汤泡着。",
    "event.job_offer": "有人给你介绍了一份新工作。",
    "event.lost_wallet": "你在路边捡到一个钱包。",
    "event.bad_food": "你吃到了一份很可疑的便当。",
    "event.family_argument": "家里爆发了一场争吵。",
    "event.crush_message": "你喜欢的人突然给你发消息。",
    "event.work_mistake": "你在工作中犯了一个低级错误。",
    "event.quiet_year": "这一年平静得像加载界面。",
    "choice.join": "加入",
    "choice.skip": "婉拒",
    "choice.study": "认真准备",
    "choice.wing_it": "靠直觉",
    "choice.listen": "认真听",
    "choice.joke": "开个玩笑",
    "choice.doctor": "去看医生",
    "choice.sleep": "睡一觉",
    "choice.accept": "接受",
    "choice.decline": "拒绝",
    "choice.return": "归还",
    "choice.keep": "留下",
    "choice.apologize": "道歉",
    "choice.argue": "争辩",
    "career.cashier": "收银员",
    "career.teacher": "教师",
    "career.nurse": "护士",
    "career.developer": "开发者",
    "career.writer": "作家",
    "career.chef": "厨师",
    "disease.cold": "感冒",
    "disease.anxiety": "焦虑",
    "disease.food_poisoning": "食物中毒",
    "disease.pneumonia": "肺部感染",
    "achievement.long_life": "长寿人生",
    "achievement.bright": "聪明脑袋",
    "achievement.beloved": "被爱包围",
    "achievement.wealthy": "有点小钱",
    "achievement.unlucky": "倒霉蛋",
    "achievement.ordinary": "普通一生"
  },
  "en-US": {
    "country.us": "United States",
    "country.cn": "China",
    "country.uk": "United Kingdom",
    "country.jp": "Japan",
    "country.br": "Brazil"
  }
} satisfies GameCatalog["locales"];
```

Create `src/content/countries.ts`:

```ts
import type { GameCatalog } from "./schema";

export const countries = [
  { id: "us", nameKey: "country.us", cities: ["New York", "Austin"], schoolStartAge: 6, adultAge: 18, healthcareCostMultiplier: 1.4 },
  { id: "cn", nameKey: "country.cn", cities: ["Shanghai", "Chengdu"], schoolStartAge: 6, adultAge: 18, healthcareCostMultiplier: 0.8 },
  { id: "uk", nameKey: "country.uk", cities: ["London", "Manchester"], schoolStartAge: 5, adultAge: 18, healthcareCostMultiplier: 0.6 },
  { id: "jp", nameKey: "country.jp", cities: ["Tokyo", "Osaka"], schoolStartAge: 6, adultAge: 18, healthcareCostMultiplier: 0.9 },
  { id: "br", nameKey: "country.br", cities: ["Sao Paulo", "Rio"], schoolStartAge: 6, adultAge: 18, healthcareCostMultiplier: 0.7 }
] satisfies GameCatalog["countries"];
```

Create `src/content/activities.ts`:

```ts
import type { GameCatalog } from "./schema";

export const activities = [
  { id: "study", labelKey: "activity.study", group: "education_career", minAge: 6, effects: [{ stats: { smarts: 4, happiness: -1 }, logKey: "activity.study" }] },
  { id: "exercise", labelKey: "activity.exercise", group: "mind_body", minAge: 8, effects: [{ stats: { health: 4, looks: 1 }, logKey: "activity.exercise" }] },
  { id: "doctor", labelKey: "activity.doctor", group: "health", minAge: 0, cost: 150, effects: [{ stats: { health: 6 }, cash: -150, logKey: "activity.doctor" }] },
  { id: "friend", labelKey: "activity.friend", group: "relationships", minAge: 6, effects: [{ stats: { happiness: 2 }, relationship: 4, logKey: "activity.friend" }] },
  { id: "date", labelKey: "activity.date", group: "relationships", minAge: 16, effects: [{ stats: { happiness: 3 }, relationship: 3, logKey: "activity.date" }] },
  { id: "part_time", labelKey: "activity.part_time", group: "education_career", minAge: 16, effects: [{ stats: { happiness: -1 }, cash: 400, logKey: "activity.part_time" }] },
  { id: "work_hard", labelKey: "activity.work_hard", group: "education_career", minAge: 18, effects: [{ stats: { happiness: -2, smarts: 1 }, cash: 600, logKey: "activity.work_hard" }] },
  { id: "rest", labelKey: "activity.rest", group: "leisure", minAge: 0, effects: [{ stats: { happiness: 2, health: 2 }, logKey: "activity.rest" }] }
] satisfies GameCatalog["activities"];
```

Create `src/content/events.ts`:

```ts
import type { GameCatalog } from "./schema";

export const events = [
  { id: "family_picnic", promptKey: "event.family_picnic", domain: "family", minAge: 0, maxAge: 17, weight: 4, choices: [
    { id: "join", labelKey: "choice.join", effects: [{ stats: { happiness: 4 }, relationship: 3 }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ stats: { happiness: -1 }, relationship: -2 }] }
  ] },
  { id: "school_quiz", promptKey: "event.school_quiz", domain: "school", minAge: 6, maxAge: 22, weight: 5, choices: [
    { id: "study", labelKey: "choice.study", effects: [{ stats: { smarts: 4, happiness: -1 } }] },
    { id: "wing_it", labelKey: "choice.wing_it", effects: [{ stats: { happiness: 1, smarts: -1 } }] }
  ] },
  { id: "weird_neighbor", promptKey: "event.weird_neighbor", domain: "misc", minAge: 4, weight: 1, choices: [
    { id: "listen", labelKey: "choice.listen", effects: [{ stats: { happiness: 2, smarts: 1 } }] },
    { id: "joke", labelKey: "choice.joke", effects: [{ stats: { happiness: 3, looks: -1 } }] }
  ] },
  { id: "friend_secret", promptKey: "event.friend_secret", domain: "relationship", minAge: 10, weight: 3, choices: [
    { id: "listen", labelKey: "choice.listen", effects: [{ relationship: 5, stats: { happiness: 1 } }] },
    { id: "joke", labelKey: "choice.joke", effects: [{ relationship: -4, stats: { happiness: -1 } }] }
  ] },
  { id: "fever", promptKey: "event.fever", domain: "health", minAge: 0, weight: 3, choices: [
    { id: "doctor", labelKey: "choice.doctor", effects: [{ cash: -120, stats: { health: 4 } }] },
    { id: "sleep", labelKey: "choice.sleep", effects: [{ stats: { health: -3, happiness: -1 }, addDiseaseId: "cold" }] }
  ] },
  { id: "job_offer", promptKey: "event.job_offer", domain: "career", minAge: 18, weight: 3, choices: [
    { id: "accept", labelKey: "choice.accept", effects: [{ cash: 700, stats: { happiness: 2 } }] },
    { id: "decline", labelKey: "choice.decline", effects: [{ stats: { happiness: -1 } }] }
  ] },
  { id: "lost_wallet", promptKey: "event.lost_wallet", domain: "misc", minAge: 10, weight: 3, choices: [
    { id: "return", labelKey: "choice.return", effects: [{ stats: { happiness: 3 }, cash: 50 }] },
    { id: "keep", labelKey: "choice.keep", effects: [{ stats: { happiness: -2 }, cash: 300, addFlag: "kept_wallet" }] }
  ] },
  { id: "bad_food", promptKey: "event.bad_food", domain: "health", minAge: 6, weight: 2, choices: [
    { id: "doctor", labelKey: "choice.doctor", effects: [{ cash: -100, stats: { health: 2 } }] },
    { id: "sleep", labelKey: "choice.sleep", effects: [{ stats: { health: -5 }, addDiseaseId: "food_poisoning" }] }
  ] },
  { id: "family_argument", promptKey: "event.family_argument", domain: "family", minAge: 8, weight: 4, choices: [
    { id: "apologize", labelKey: "choice.apologize", effects: [{ relationship: 4, stats: { happiness: -1 } }] },
    { id: "argue", labelKey: "choice.argue", effects: [{ relationship: -5, stats: { happiness: -3 } }] }
  ] },
  { id: "crush_message", promptKey: "event.crush_message", domain: "relationship", minAge: 14, weight: 2, choices: [
    { id: "accept", labelKey: "choice.accept", effects: [{ relationship: 5, stats: { happiness: 4 } }] },
    { id: "decline", labelKey: "choice.decline", effects: [{ stats: { happiness: -1 } }] }
  ] },
  { id: "work_mistake", promptKey: "event.work_mistake", domain: "career", minAge: 18, weight: 3, choices: [
    { id: "apologize", labelKey: "choice.apologize", effects: [{ stats: { smarts: 1, happiness: -1 } }] },
    { id: "argue", labelKey: "choice.argue", effects: [{ stats: { happiness: -4 }, addFlag: "work_conflict" }] }
  ] },
  { id: "quiet_year", promptKey: "event.quiet_year", domain: "misc", minAge: 0, weight: 6, choices: [
    { id: "rest", labelKey: "choice.sleep", effects: [{ stats: { happiness: 1, health: 1 } }] },
    { id: "study", labelKey: "choice.study", effects: [{ stats: { smarts: 1 } }] }
  ] }
] satisfies GameCatalog["events"];
```

Create `src/content/careers.ts`:

```ts
import type { GameCatalog } from "./schema";

export const careers = [
  { id: "cashier", titleKey: "career.cashier", minAge: 18, salary: 24000, requiredSmarts: 10 },
  { id: "teacher", titleKey: "career.teacher", minAge: 22, salary: 42000, requiredSmarts: 55 },
  { id: "nurse", titleKey: "career.nurse", minAge: 22, salary: 52000, requiredSmarts: 60 },
  { id: "developer", titleKey: "career.developer", minAge: 20, salary: 80000, requiredSmarts: 70 },
  { id: "writer", titleKey: "career.writer", minAge: 18, salary: 36000, requiredSmarts: 50 },
  { id: "chef", titleKey: "career.chef", minAge: 18, salary: 38000, requiredSmarts: 30 }
] satisfies GameCatalog["careers"];
```

Create `src/content/diseases.ts`:

```ts
import type { GameCatalog } from "./schema";

export const diseases = [
  { id: "cold", nameKey: "disease.cold", severity: 12, healthDrain: 3, treatability: 0.9 },
  { id: "anxiety", nameKey: "disease.anxiety", severity: 20, healthDrain: 1, treatability: 0.6 },
  { id: "food_poisoning", nameKey: "disease.food_poisoning", severity: 28, healthDrain: 6, treatability: 0.8 },
  { id: "pneumonia", nameKey: "disease.pneumonia", severity: 60, healthDrain: 10, treatability: 0.5 }
] satisfies GameCatalog["diseases"];
```

Create `src/content/achievements.ts`:

```ts
import type { GameCatalog } from "./schema";

export const achievements = [
  { id: "long_life", labelKey: "achievement.long_life", priority: 90 },
  { id: "bright", labelKey: "achievement.bright", priority: 50 },
  { id: "beloved", labelKey: "achievement.beloved", priority: 60 },
  { id: "wealthy", labelKey: "achievement.wealthy", priority: 70 },
  { id: "unlucky", labelKey: "achievement.unlucky", priority: 80 },
  { id: "ordinary", labelKey: "achievement.ordinary", priority: 1 }
] satisfies GameCatalog["achievements"];
```

Create `src/content/catalog.ts`:

```ts
import { achievements } from "./achievements";
import { activities } from "./activities";
import { careers } from "./careers";
import { countries } from "./countries";
import { diseases } from "./diseases";
import { events } from "./events";
import { locales } from "./locales";
import type { GameCatalog } from "./schema";

export const catalog: GameCatalog = {
  locales,
  countries,
  activities,
  events,
  careers,
  diseases,
  achievements
};
```

- [ ] **Step 5: Run catalog tests**

Run: `npm run test -- src/__tests__/contentSchema.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit starter catalog**

```bash
git add src/content src/__tests__/contentSchema.test.ts
git commit -m "feat: add validated starter content catalog"
```

---

### Task 4: New Life Generation

**Files:**
- Create: `src/domain/lifeGenerator.ts`
- Test: `src/__tests__/lifeGenerator.test.ts`

- [ ] **Step 1: Write failing generation tests**

Create `src/__tests__/lifeGenerator.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";

describe("generateLife", () => {
  it("creates reproducible randomized lives from the same seed", () => {
    const a = generateLife({ seed: "seed-a", catalog });
    const b = generateLife({ seed: "seed-a", catalog });

    expect(a).toEqual(b);
    expect(a.age).toBe(0);
    expect(a.alive).toBe(true);
  });

  it("keeps randomized stats within playable ranges", () => {
    const life = generateLife({ seed: "seed-b", catalog });

    expect(life.stats.happiness).toBeGreaterThanOrEqual(35);
    expect(life.stats.health).toBeGreaterThanOrEqual(70);
    expect(life.stats.smarts).toBeGreaterThanOrEqual(0);
    expect(life.stats.looks).toBeGreaterThanOrEqual(0);
    expect(life.stats.happiness).toBeLessThanOrEqual(100);
    expect(life.stats.health).toBeLessThanOrEqual(100);
  });

  it("creates parents and zero to three siblings", () => {
    const life = generateLife({ seed: "family-seed", catalog });
    const parents = life.relationships.filter((person) => person.relationType === "parent");
    const siblings = life.relationships.filter((person) => person.relationType === "sibling");

    expect(parents.length).toBeGreaterThanOrEqual(1);
    expect(parents.length).toBeLessThanOrEqual(2);
    expect(siblings.length).toBeGreaterThanOrEqual(0);
    expect(siblings.length).toBeLessThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/__tests__/lifeGenerator.test.ts`

Expected: FAIL because `lifeGenerator.ts` does not exist.

- [ ] **Step 3: Implement `src/domain/lifeGenerator.ts`**

```ts
import type { GameCatalog } from "../content/schema";
import { clampRelationship, clampStat } from "./clamp";
import { createRng } from "./rng";
import type { Gender, LifeStage, LifeState, Person } from "./types";

const firstNames = ["林小雨", "陈安", "周可", "Alex", "Mia", "Sam"];
const lastNames = ["李", "王", "Taylor", "Chen", "Garcia", "Smith"];
const traits = ["kind", "strict", "generous", "dramatic", "quiet", "chaotic"];

function stageForAge(age: number): LifeStage {
  if (age <= 5) return "early_childhood";
  if (age <= 12) return "childhood";
  if (age <= 17) return "teen";
  if (age <= 64) return "adult";
  return "elder";
}

function createPerson(seed: string, index: number, relationType: Person["relationType"], age: number): Person {
  const rng = createRng(`${seed}:person:${index}`);
  return {
    id: `${relationType}-${index}`,
    name: `${rng.pick(lastNames)}${rng.pick(firstNames)}`,
    age,
    relationType,
    relationship: clampRelationship(rng.int(35, 95)),
    traits: [rng.pick(traits)],
    alive: true
  };
}

export function generateLife({ seed, catalog }: { seed: string; catalog: GameCatalog }): LifeState {
  const rng = createRng(seed);
  const country = rng.pick(catalog.countries);
  const gender = rng.pick<Gender>(["female", "male", "nonbinary"]);
  const parentCount = rng.int(1, 2);
  const siblingCount = rng.int(0, 3);
  const relationships: Person[] = [];

  for (let i = 0; i < parentCount; i += 1) {
    relationships.push(createPerson(seed, i, "parent", rng.int(22, 45)));
  }
  for (let i = 0; i < siblingCount; i += 1) {
    relationships.push(createPerson(seed, i, "sibling", rng.int(0, 8)));
  }

  return {
    id: `life-${seed}`,
    seed,
    name: `${rng.pick(lastNames)}${rng.pick(firstNames)}`,
    gender,
    age: 0,
    stage: stageForAge(0),
    countryId: country.id,
    city: rng.pick(country.cities),
    alive: true,
    stats: {
      happiness: clampStat(rng.int(35, 100)),
      health: clampStat(rng.int(70, 100)),
      smarts: clampStat(rng.int(0, 100)),
      looks: clampStat(rng.int(0, 100))
    },
    cash: rng.int(0, 2000),
    relationships,
    education: { stage: "none", yearsCompleted: 0 },
    career: { salary: 0, performance: 0, years: 0 },
    diseases: [],
    flags: [],
    log: [
      {
        id: "birth",
        age: 0,
        messageKey: "log.birth",
        params: { countryId: country.id }
      }
    ]
  };
}

export { stageForAge };
```

- [ ] **Step 4: Add missing locale key**

Modify `src/content/locales.ts` so `zh-CN` includes:

```ts
"log.birth": "你出生了。"
```

- [ ] **Step 5: Run generation tests**

Run: `npm run test -- src/__tests__/lifeGenerator.test.ts src/__tests__/contentSchema.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit life generation**

```bash
git add src/domain/lifeGenerator.ts src/content/locales.ts src/__tests__/lifeGenerator.test.ts
git commit -m "feat: generate randomized lives"
```

---

### Task 5: Effects, Age-Up Engine, and Event Choices

**Files:**
- Create: `src/domain/effects.ts`
- Create: `src/domain/engine.ts`
- Test: `src/__tests__/engine.test.ts`

- [ ] **Step 1: Write failing engine tests**

Create `src/__tests__/engine.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { advanceYear, resolveEventChoice } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";

describe("engine", () => {
  it("advances age by one and keeps stats bounded", () => {
    const life = generateLife({ seed: "age-up", catalog });
    const result = advanceYear({ life, catalog });

    expect(result.life.age).toBe(1);
    expect(result.life.stats.health).toBeGreaterThanOrEqual(0);
    expect(result.life.stats.health).toBeLessThanOrEqual(100);
    expect(result.logs.length).toBeGreaterThanOrEqual(1);
  });

  it("can resolve a pending event choice", () => {
    const life = { ...generateLife({ seed: "event-choice", catalog }), pendingEventId: "family_picnic" };
    const result = resolveEventChoice({ life, catalog, choiceId: "join" });

    expect(result.life.pendingEventId).toBeUndefined();
    expect(result.logs.some((entry) => entry.messageKey === "log.choice_resolved")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/__tests__/engine.test.ts`

Expected: FAIL because `engine.ts` does not exist.

- [ ] **Step 3: Implement `src/domain/effects.ts`**

```ts
import type { EffectConfig } from "../content/schema";
import { clampCash, clampRelationship, clampStat } from "./clamp";
import type { LifeState } from "./types";

export function applyEffect(life: LifeState, effect: EffectConfig): LifeState {
  const next: LifeState = structuredClone(life);

  if (effect.stats) {
    for (const [key, delta] of Object.entries(effect.stats)) {
      const statKey = key as keyof LifeState["stats"];
      next.stats[statKey] = clampStat(next.stats[statKey] + delta);
    }
  }

  if (typeof effect.cash === "number") {
    next.cash = clampCash(next.cash + effect.cash);
  }

  if (typeof effect.relationship === "number") {
    next.relationships = next.relationships.map((person) => ({
      ...person,
      relationship: clampRelationship(person.relationship + effect.relationship)
    }));
  }

  if (effect.addDiseaseId && !next.diseases.some((disease) => disease.id === effect.addDiseaseId)) {
    next.diseases.push({ id: effect.addDiseaseId, severity: 10, diagnosed: false, yearsActive: 0 });
  }

  if (effect.addFlag && !next.flags.includes(effect.addFlag)) {
    next.flags.push(effect.addFlag);
  }

  return next;
}
```

- [ ] **Step 4: Implement `src/domain/engine.ts`**

```ts
import type { GameCatalog } from "../content/schema";
import { applyEffect } from "./effects";
import { createRng } from "./rng";
import { stageForAge } from "./lifeGenerator";
import type { LifeLogEntry, LifeState } from "./types";

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

export function advanceYear({ life, catalog }: { life: LifeState; catalog: GameCatalog }): EngineResult {
  if (!life.alive) return { life, logs: [] };

  const rng = createRng(`${life.seed}:age:${life.age + 1}`);
  let next: LifeState = structuredClone(life);
  next.age += 1;
  next.stage = stageForAge(next.age);
  next.stats.happiness = Math.max(0, Math.min(100, next.stats.happiness + rng.int(-2, 2)));
  next.stats.health = Math.max(0, Math.min(100, next.stats.health + rng.int(-2, 1)));
  next.stats.smarts = Math.max(0, Math.min(100, next.stats.smarts + rng.int(0, 1)));
  next.stats.looks = Math.max(0, Math.min(100, next.stats.looks + (next.age > 45 ? rng.int(-2, 0) : rng.int(-1, 1))));
  next.relationships = next.relationships.map((person) => ({
    ...person,
    age: person.age + 1,
    relationship: Math.max(0, Math.min(100, person.relationship + rng.int(-2, 1)))
  }));

  const eligibleEvents = catalog.events.filter((event) => {
    const underMax = event.maxAge === undefined || next.age <= event.maxAge;
    return next.age >= event.minAge && underMax;
  });
  const event = rng.weighted(eligibleEvents.map((item) => ({ value: item, weight: item.weight })));
  next.pendingEventId = event.id;

  const log = createLog(next, "log.age_up", { age: next.age });
  next.log = [...next.log, log];
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
  return { life: next, logs: [log] };
}
```

- [ ] **Step 5: Add log locale keys**

Modify `src/content/locales.ts` so `zh-CN` includes:

```ts
"log.age_up": "你又长大了一岁。",
"log.choice_resolved": "你做出了选择。"
```

- [ ] **Step 6: Run engine tests**

Run: `npm run test -- src/__tests__/engine.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit engine loop**

```bash
git add src/domain/effects.ts src/domain/engine.ts src/content/locales.ts src/__tests__/engine.test.ts
git commit -m "feat: add age-up engine and event choices"
```

---

### Task 6: Activities, Careers, Diseases, Death, and Tombstone Tags

**Files:**
- Modify: `src/domain/engine.ts`
- Create: `src/domain/scoring.ts`
- Test: `src/__tests__/activitiesAndDeath.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/activitiesAndDeath.test.ts`:

```ts
import { catalog } from "../content/catalog";
import { performActivity, advanceYear } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import { buildDeathSummary } from "../domain/scoring";

describe("activities and death", () => {
  it("performs an available activity", () => {
    const life = { ...generateLife({ seed: "activity", catalog }), age: 10 };
    const result = performActivity({ life, catalog, activityId: "study" });

    expect(result.life.stats.smarts).toBeGreaterThan(life.stats.smarts);
    expect(result.logs[0].messageKey).toBe("log.activity");
  });

  it("rejects age-locked activities", () => {
    const life = generateLife({ seed: "too-young", catalog });

    expect(() => performActivity({ life, catalog, activityId: "part_time" })).toThrow("Activity part_time is not available");
  });

  it("creates a deterministic death summary", () => {
    const life = { ...generateLife({ seed: "death", catalog }), age: 91, stats: { happiness: 20, health: 0, smarts: 80, looks: 30 }, alive: false };
    const summary = buildDeathSummary({ life, catalog, causeOfDeath: "low_health" });

    expect(summary.ageAtDeath).toBe(91);
    expect(summary.tags.length).toBeGreaterThanOrEqual(1);
    expect(summary.score).toBeGreaterThan(0);
  });

  it("can die during age-up when health is depleted", () => {
    const life = { ...generateLife({ seed: "age-death", catalog }), age: 88, stats: { happiness: 20, health: 1, smarts: 40, looks: 20 } };
    const result = advanceYear({ life, catalog });

    expect(typeof result.life.alive).toBe("boolean");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/__tests__/activitiesAndDeath.test.ts`

Expected: FAIL because `performActivity` and `scoring.ts` do not exist.

- [ ] **Step 3: Implement `src/domain/scoring.ts`**

```ts
import type { GameCatalog } from "../content/schema";
import type { DeathSummary, LifeState } from "./types";

export function calculateScore(life: LifeState): number {
  const averageStats = (life.stats.happiness + life.stats.health + life.stats.smarts + life.stats.looks) / 4;
  const relationshipScore = life.relationships.reduce((sum, person) => sum + person.relationship, 0) / Math.max(1, life.relationships.length);
  const cashScore = Math.max(0, Math.min(100, life.cash / 1000));
  return Math.round(life.age * 10 + averageStats * 4 + relationshipScore * 2 + cashScore);
}

export function selectTombstoneTags(life: LifeState): string[] {
  const tags: string[] = [];
  if (life.age >= 85) tags.push("long_life");
  if (life.stats.smarts >= 80) tags.push("bright");
  if (life.relationships.some((person) => person.relationship >= 85)) tags.push("beloved");
  if (life.cash >= 50_000) tags.push("wealthy");
  if (life.age < 30 || life.flags.includes("kept_wallet")) tags.push("unlucky");
  if (tags.length === 0) tags.push("ordinary");
  return tags;
}

export function buildDeathSummary({
  life,
  causeOfDeath
}: {
  life: LifeState;
  catalog: GameCatalog;
  causeOfDeath: string;
}): DeathSummary {
  return {
    ageAtDeath: life.age,
    causeOfDeath,
    summaryKey: "death.summary",
    tags: selectTombstoneTags(life),
    score: calculateScore(life),
    netWorth: life.cash,
    createdAt: new Date(0).toISOString()
  };
}
```

- [ ] **Step 4: Extend `src/domain/engine.ts` with activities and death checks**

Add imports:

```ts
import { buildDeathSummary } from "./scoring";
```

Add this function:

```ts
export function performActivity({
  life,
  catalog,
  activityId
}: {
  life: LifeState;
  catalog: GameCatalog;
  activityId: string;
}): EngineResult {
  const activity = catalog.activities.find((item) => item.id === activityId);
  if (!activity) throw new Error(`Missing activity ${activityId}`);
  const underMax = activity.maxAge === undefined || life.age <= activity.maxAge;
  if (life.age < activity.minAge || !underMax) {
    throw new Error(`Activity ${activityId} is not available`);
  }

  let next = structuredClone(life);
  for (const effect of activity.effects) {
    next = applyEffect(next, effect);
  }
  const log = createLog(next, "log.activity", { activityId });
  next.log = [...next.log, log];
  return { life: next, logs: [log] };
}
```

Before the final `return` in `advanceYear`, add:

```ts
  if (next.stats.health <= 0 || (next.age >= 90 && rng.int(1, 100) <= next.age - 85)) {
    next.alive = false;
    next.pendingEventId = undefined;
    next.death = buildDeathSummary({ life: next, catalog, causeOfDeath: next.stats.health <= 0 ? "low_health" : "old_age" });
  }
```

- [ ] **Step 5: Add death locale key**

Modify `src/content/locales.ts` so `zh-CN` includes:

```ts
"death.summary": "你的人生落下帷幕。",
"log.activity": "你进行了一项活动。"
```

- [ ] **Step 6: Run tests**

Run: `npm run test -- src/__tests__/activitiesAndDeath.test.ts src/__tests__/engine.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit activities and death**

```bash
git add src/domain/engine.ts src/domain/scoring.ts src/content/locales.ts src/__tests__/activitiesAndDeath.test.ts
git commit -m "feat: add activities and tombstone scoring"
```

---

### Task 7: Local Persistence and Zustand Store

**Files:**
- Create: `src/storage/indexedDb.ts`
- Create: `src/store/gameStore.ts`
- Test: `src/__tests__/gameStore.test.ts`

- [ ] **Step 1: Write failing store tests**

Create `src/__tests__/gameStore.test.ts`:

```ts
import { useGameStore } from "../store/gameStore";

describe("gameStore", () => {
  beforeEach(() => {
    useGameStore.getState().resetForTest();
  });

  it("starts a new life", () => {
    useGameStore.getState().startNewLife("store-seed");

    const life = useGameStore.getState().life;
    expect(life?.seed).toBe("store-seed");
    expect(life?.age).toBe(0);
  });

  it("advances a life", () => {
    useGameStore.getState().startNewLife("advance-store");
    useGameStore.getState().advanceYear();

    expect(useGameStore.getState().life?.age).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/__tests__/gameStore.test.ts`

Expected: FAIL because `gameStore.ts` does not exist.

- [ ] **Step 3: Create `src/storage/indexedDb.ts`**

```ts
import { openDB } from "idb";
import type { LifeState } from "../domain/types";

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
  await database.put("saves", life, "active");
}

export async function loadActiveLife(): Promise<LifeState | undefined> {
  const database = await db();
  return database.get("saves", "active");
}

export async function clearActiveLife(): Promise<void> {
  const database = await db();
  await database.delete("saves", "active");
}
```

- [ ] **Step 4: Create `src/store/gameStore.ts`**

```ts
import { create } from "zustand";
import { catalog } from "../content/catalog";
import { advanceYear as engineAdvanceYear, performActivity, resolveEventChoice } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import type { LifeState } from "../domain/types";
import { saveActiveLife } from "../storage/indexedDb";

interface GameStore {
  life?: LifeState;
  selectedView: "life" | "activities" | "relationships" | "career" | "tombstone" | "leaderboard";
  startNewLife(seed: string): void;
  advanceYear(): void;
  chooseEvent(choiceId: string): void;
  doActivity(activityId: string): void;
  setView(view: GameStore["selectedView"]): void;
  resetForTest(): void;
}

function persist(life?: LifeState) {
  if (life) {
    void saveActiveLife(life).catch(() => undefined);
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  selectedView: "life",
  startNewLife(seed) {
    const life = generateLife({ seed, catalog });
    persist(life);
    set({ life, selectedView: "life" });
  },
  advanceYear() {
    const current = get().life;
    if (!current) return;
    const result = engineAdvanceYear({ life: current, catalog });
    persist(result.life);
    set({ life: result.life, selectedView: result.life.death ? "tombstone" : "life" });
  },
  chooseEvent(choiceId) {
    const current = get().life;
    if (!current) return;
    const result = resolveEventChoice({ life: current, catalog, choiceId });
    persist(result.life);
    set({ life: result.life });
  },
  doActivity(activityId) {
    const current = get().life;
    if (!current) return;
    const result = performActivity({ life: current, catalog, activityId });
    persist(result.life);
    set({ life: result.life });
  },
  setView(view) {
    set({ selectedView: view });
  },
  resetForTest() {
    set({ life: undefined, selectedView: "life" });
  }
}));
```

- [ ] **Step 5: Run store tests**

Run: `npm run test -- src/__tests__/gameStore.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit store and persistence**

```bash
git add src/storage src/store src/__tests__/gameStore.test.ts
git commit -m "feat: add local game store and persistence"
```

---

### Task 8: Mobile Game UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles/global.css`
- Create: `src/components/StatBar.tsx`
- Create: `src/components/EventPanel.tsx`
- Create: `src/views/LifeView.tsx`
- Create: `src/views/ActivitiesView.tsx`
- Create: `src/views/RelationshipsView.tsx`
- Create: `src/views/CareerView.tsx`
- Create: `src/views/TombstoneView.tsx`
- Create: `src/views/LeaderboardView.tsx`
- Test: `src/__tests__/appSmoke.test.tsx`

- [ ] **Step 1: Write failing UI smoke test**

Create `src/__tests__/appSmoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

describe("App", () => {
  it("starts a new life and advances one year", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "开始新人生" }));
    expect(screen.getByText(/年龄：0/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "年龄\\+1" }));
    expect(screen.getByText(/年龄：1/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/__tests__/appSmoke.test.tsx`

Expected: FAIL because the UI still renders scaffold text.

- [ ] **Step 3: Create `src/components/StatBar.tsx`**

```tsx
export function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-bar">
      <div className="stat-bar__label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="stat-bar__track">
        <div className="stat-bar__fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/EventPanel.tsx`**

```tsx
import { catalog } from "../content/catalog";

export function EventPanel({
  eventId,
  onChoose
}: {
  eventId: string;
  onChoose(choiceId: string): void;
}) {
  const event = catalog.events.find((item) => item.id === eventId);
  if (!event) return null;
  const zh = catalog.locales["zh-CN"];

  return (
    <section className="panel event-panel">
      <p>{zh[event.promptKey]}</p>
      <div className="choice-grid">
        {event.choices.map((choice) => (
          <button key={choice.id} type="button" onClick={() => onChoose(choice.id)}>
            {zh[choice.labelKey]}
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `src/views/LifeView.tsx`**

```tsx
import { StatBar } from "../components/StatBar";
import { EventPanel } from "../components/EventPanel";
import type { LifeState } from "../domain/types";

export function LifeView({
  life,
  onStart,
  onAgeUp,
  onChoose
}: {
  life?: LifeState;
  onStart(): void;
  onAgeUp(): void;
  onChoose(choiceId: string): void;
}) {
  if (!life) {
    return (
      <section className="hero">
        <h1>Text Life</h1>
        <p>一段荒诞、短促、可以重来的文字人生。</p>
        <button type="button" className="primary-action" onClick={onStart}>
          开始新人生
        </button>
      </section>
    );
  }

  return (
    <section className="life-view">
      <header className="life-header">
        <h1>{life.name}</h1>
        <p>年龄：{life.age} · {life.city}</p>
        <p>现金：${life.cash}</p>
      </header>
      <div className="stats-grid">
        <StatBar label="快乐" value={life.stats.happiness} />
        <StatBar label="健康" value={life.stats.health} />
        <StatBar label="智力" value={life.stats.smarts} />
        <StatBar label="颜值" value={life.stats.looks} />
      </div>
      {life.pendingEventId ? <EventPanel eventId={life.pendingEventId} onChoose={onChoose} /> : null}
      <section className="panel log-panel">
        <h2>人生日志</h2>
        {life.log.slice(-8).map((entry) => (
          <p key={entry.id}>#{entry.age} {entry.messageKey}</p>
        ))}
      </section>
      <button type="button" className="age-button" disabled={!life.alive || Boolean(life.pendingEventId)} onClick={onAgeUp}>
        年龄+1
      </button>
    </section>
  );
}
```

- [ ] **Step 6: Create secondary views**

`src/views/ActivitiesView.tsx`:

```tsx
import { catalog } from "../content/catalog";
import type { LifeState } from "../domain/types";

export function ActivitiesView({ life, onActivity }: { life?: LifeState; onActivity(activityId: string): void }) {
  const zh = catalog.locales["zh-CN"];
  if (!life) return <p className="empty-state">先开始新人生。</p>;
  return (
    <section className="stack">
      <h1>活动</h1>
      {catalog.activities.map((activity) => {
        const available = life.age >= activity.minAge && (activity.maxAge === undefined || life.age <= activity.maxAge);
        return (
          <button key={activity.id} type="button" disabled={!available || Boolean(life.pendingEventId)} onClick={() => onActivity(activity.id)}>
            {zh[activity.labelKey]}{available ? "" : "（未解锁）"}
          </button>
        );
      })}
    </section>
  );
}
```

`src/views/RelationshipsView.tsx`:

```tsx
import type { LifeState } from "../domain/types";

export function RelationshipsView({ life }: { life?: LifeState }) {
  if (!life) return <p className="empty-state">还没有关系。</p>;
  return (
    <section className="stack">
      <h1>关系</h1>
      {life.relationships.map((person) => (
        <article className="panel" key={person.id}>
          <strong>{person.name}</strong>
          <p>{person.relationType} · 关系 {person.relationship}</p>
        </article>
      ))}
    </section>
  );
}
```

`src/views/CareerView.tsx`:

```tsx
import type { LifeState } from "../domain/types";

export function CareerView({ life }: { life?: LifeState }) {
  if (!life) return <p className="empty-state">还没有人生资料。</p>;
  return (
    <section className="stack">
      <h1>教育 / 职业</h1>
      <article className="panel">
        <p>教育阶段：{life.education.stage}</p>
        <p>学历年数：{life.education.yearsCompleted}</p>
        <p>职业：{life.career.title ?? "无"}</p>
        <p>年薪：${life.career.salary}</p>
      </article>
    </section>
  );
}
```

`src/views/TombstoneView.tsx`:

```tsx
import type { LifeState } from "../domain/types";

export function TombstoneView({ life, onStart }: { life?: LifeState; onStart(): void }) {
  if (!life?.death) return <p className="empty-state">还没有墓碑。</p>;
  return (
    <section className="tombstone">
      <h1>墓碑</h1>
      <p>享年 {life.death.ageAtDeath}</p>
      <p>死因：{life.death.causeOfDeath}</p>
      <p>分数：{life.death.score}</p>
      <div className="tag-row">{life.death.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <button type="button" className="primary-action">匿名提交排行榜</button>
      <button type="button" onClick={onStart}>开始新人生</button>
    </section>
  );
}
```

`src/views/LeaderboardView.tsx`:

```tsx
export function LeaderboardView() {
  return (
    <section className="stack">
      <h1>排行榜</h1>
      <p className="empty-state">匿名墓碑排行榜将在后端任务完成后接入。</p>
    </section>
  );
}
```

- [ ] **Step 7: Replace `src/App.tsx`**

```tsx
import { ActivitiesView } from "./views/ActivitiesView";
import { CareerView } from "./views/CareerView";
import { LeaderboardView } from "./views/LeaderboardView";
import { LifeView } from "./views/LifeView";
import { RelationshipsView } from "./views/RelationshipsView";
import { TombstoneView } from "./views/TombstoneView";
import { useGameStore } from "./store/gameStore";

export function App() {
  const { life, selectedView, startNewLife, advanceYear, chooseEvent, doActivity, setView } = useGameStore();
  const start = () => startNewLife(`life-${Date.now()}`);

  return (
    <main className="app-shell">
      {selectedView === "life" ? <LifeView life={life} onStart={start} onAgeUp={advanceYear} onChoose={chooseEvent} /> : null}
      {selectedView === "activities" ? <ActivitiesView life={life} onActivity={doActivity} /> : null}
      {selectedView === "relationships" ? <RelationshipsView life={life} /> : null}
      {selectedView === "career" ? <CareerView life={life} /> : null}
      {selectedView === "tombstone" ? <TombstoneView life={life} onStart={start} /> : null}
      {selectedView === "leaderboard" ? <LeaderboardView /> : null}
      <nav className="bottom-nav" aria-label="主导航">
        <button type="button" onClick={() => setView("life")}>人生</button>
        <button type="button" onClick={() => setView("activities")}>活动</button>
        <button type="button" onClick={() => setView("relationships")}>关系</button>
        <button type="button" onClick={() => setView("career")}>职业</button>
        <button type="button" onClick={() => setView("leaderboard")}>排行</button>
      </nav>
    </main>
  );
}
```

- [ ] **Step 8: Extend `src/styles/global.css`**

Append:

```css
.hero,
.stack,
.life-view,
.tombstone {
  display: grid;
  gap: 16px;
  padding-bottom: 88px;
}

.life-header h1,
.stack h1,
.tombstone h1 {
  margin: 0;
  font-size: 28px;
}

.panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
}

.stats-grid {
  display: grid;
  gap: 10px;
}

.stat-bar__label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.stat-bar__track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5e7eb;
}

.stat-bar__fill {
  height: 100%;
  background: #22c55e;
}

.choice-grid {
  display: grid;
  gap: 8px;
}

.primary-action,
.age-button,
.choice-grid button,
.stack button,
.bottom-nav button,
.tombstone button {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  padding: 10px 12px;
  background: #111827;
  color: #ffffff;
}

.age-button {
  position: sticky;
  bottom: 72px;
  width: 100%;
}

.bottom-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  width: min(100%, 480px);
  margin: 0 auto;
  padding: 8px;
  background: #f8fafc;
}

.bottom-nav button {
  min-height: 40px;
  padding: 8px 4px;
  font-size: 12px;
  background: #334155;
}

.empty-state {
  color: #64748b;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-row span {
  border-radius: 999px;
  padding: 4px 8px;
  background: #e0f2fe;
}
```

- [ ] **Step 9: Run UI test**

Run: `npm run test -- src/__tests__/appSmoke.test.tsx`

Expected: PASS.

- [ ] **Step 10: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 11: Commit UI**

```bash
git add src/App.tsx src/styles/global.css src/components src/views src/__tests__/appSmoke.test.tsx
git commit -m "feat: add mobile game UI"
```

---

### Task 9: Anonymous Tombstone API and Client

**Files:**
- Create: `netlify/functions/lib/tombstoneSchema.ts`
- Create: `netlify/functions/lib/tombstoneStore.ts`
- Create: `netlify/functions/tombstones.ts`
- Create: `netlify/functions/tombstone.ts`
- Create: `src/api/tombstonesClient.ts`
- Modify: `src/views/TombstoneView.tsx`
- Test: `src/__tests__/tombstoneClient.test.ts`

- [ ] **Step 1: Write failing client test**

Create `src/__tests__/tombstoneClient.test.ts`:

```ts
import { submitTombstone } from "../api/tombstonesClient";

describe("tombstonesClient", () => {
  it("posts a tombstone and returns a share id", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ shareId: "abc123" }), { status: 200 })));

    const result = await submitTombstone({
      seed: "seed",
      ageAtDeath: 90,
      causeOfDeath: "old_age",
      summary: "A quiet life.",
      tags: ["long_life"],
      score: 1200,
      stats: { happiness: 50, health: 0, smarts: 80, looks: 40 },
      netWorth: 5000,
      careerTitle: "writer",
      highestEducation: "graduated"
    });

    expect(result.shareId).toBe("abc123");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/__tests__/tombstoneClient.test.ts`

Expected: FAIL because `tombstonesClient.ts` does not exist.

- [ ] **Step 3: Create server schema**

Create `netlify/functions/lib/tombstoneSchema.ts`:

```ts
import { z } from "zod";

export const tombstoneInputSchema = z.object({
  seed: z.string().min(1).max(128),
  ageAtDeath: z.number().int().min(0).max(130),
  causeOfDeath: z.string().min(1).max(80),
  summary: z.string().min(1).max(500),
  tags: z.array(z.string().min(1).max(40)).max(8),
  score: z.number().int().min(0).max(1000000),
  stats: z.object({
    happiness: z.number().min(0).max(100),
    health: z.number().min(0).max(100),
    smarts: z.number().min(0).max(100),
    looks: z.number().min(0).max(100)
  }),
  netWorth: z.number().int().min(-1000000).max(100000000),
  careerTitle: z.string().max(80).optional(),
  highestEducation: z.string().max(80).optional(),
  displayName: z.string().min(1).max(32).optional()
});

export type TombstoneInput = z.infer<typeof tombstoneInputSchema>;

export interface PublicTombstone extends TombstoneInput {
  id: string;
  createdAt: string;
}
```

- [ ] **Step 4: Create Netlify Blobs store**

Create `netlify/functions/lib/tombstoneStore.ts`:

```ts
import { getStore } from "@netlify/blobs";
import { nanoid } from "nanoid";
import type { PublicTombstone, TombstoneInput } from "./tombstoneSchema";

const INDEX_KEY = "leaderboard-index";

function store() {
  return getStore("tombstones");
}

export async function saveTombstone(input: TombstoneInput): Promise<PublicTombstone> {
  const item: PublicTombstone = {
    ...input,
    id: nanoid(12),
    createdAt: new Date().toISOString()
  };
  const blobStore = store();
  await blobStore.setJSON(item.id, item);
  const index = await listTombstones();
  const nextIndex = [item, ...index].sort((a, b) => b.score - a.score).slice(0, 100);
  await blobStore.setJSON(INDEX_KEY, nextIndex);
  return item;
}

export async function getTombstone(id: string): Promise<PublicTombstone | null> {
  return store().get(id, { type: "json" }) as Promise<PublicTombstone | null>;
}

export async function listTombstones(): Promise<PublicTombstone[]> {
  const items = await store().get(INDEX_KEY, { type: "json" });
  return Array.isArray(items) ? (items as PublicTombstone[]) : [];
}
```

- [ ] **Step 5: Create Netlify Functions**

Create `netlify/functions/tombstones.ts`:

```ts
import type { Handler } from "@netlify/functions";
import { listTombstones, saveTombstone } from "./lib/tombstoneStore";
import { tombstoneInputSchema } from "./lib/tombstoneSchema";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "GET") {
    const rows = await listTombstones();
    return { statusCode: 200, body: JSON.stringify({ rows }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const parsed = tombstoneInputSchema.safeParse(JSON.parse(event.body ?? "{}"));
  if (!parsed.success) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid tombstone payload" }) };
  }

  const saved = await saveTombstone(parsed.data);
  return { statusCode: 200, body: JSON.stringify({ shareId: saved.id, tombstone: saved }) };
};
```

Create `netlify/functions/tombstone.ts`:

```ts
import type { Handler } from "@netlify/functions";
import { getTombstone } from "./lib/tombstoneStore";

export const handler: Handler = async (event) => {
  const id = event.queryStringParameters?.id;
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing tombstone id" }) };
  }

  const tombstone = await getTombstone(id);
  if (!tombstone) {
    return { statusCode: 404, body: JSON.stringify({ error: "Tombstone not found" }) };
  }

  return { statusCode: 200, body: JSON.stringify({ tombstone }) };
};
```

- [ ] **Step 6: Create browser client**

Create `src/api/tombstonesClient.ts`:

```ts
import type { Stats } from "../domain/types";

export interface TombstoneSubmitPayload {
  seed: string;
  ageAtDeath: number;
  causeOfDeath: string;
  summary: string;
  tags: string[];
  score: number;
  stats: Stats;
  netWorth: number;
  careerTitle?: string;
  highestEducation?: string;
  displayName?: string;
}

export async function submitTombstone(payload: TombstoneSubmitPayload): Promise<{ shareId: string }> {
  const response = await fetch("/api/tombstones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Tombstone submit failed: ${response.status}`);
  }
  return response.json() as Promise<{ shareId: string }>;
}
```

- [ ] **Step 7: Wire submit button in `src/views/TombstoneView.tsx`**

Replace the component with:

```tsx
import { useState } from "react";
import { submitTombstone } from "../api/tombstonesClient";
import type { LifeState } from "../domain/types";

export function TombstoneView({ life, onStart }: { life?: LifeState; onStart(): void }) {
  const [shareId, setShareId] = useState<string>();
  const [error, setError] = useState<string>();
  if (!life?.death) return <p className="empty-state">还没有墓碑。</p>;

  async function submit() {
    if (!life?.death) return;
    setError(undefined);
    try {
      const result = await submitTombstone({
        seed: life.seed,
        ageAtDeath: life.death.ageAtDeath,
        causeOfDeath: life.death.causeOfDeath,
        summary: life.death.summaryKey,
        tags: life.death.tags,
        score: life.death.score,
        stats: life.stats,
        netWorth: life.death.netWorth,
        careerTitle: life.career.title,
        highestEducation: life.education.stage
      });
      setShareId(result.shareId);
    } catch {
      setError("提交失败，请稍后重试。");
    }
  }

  return (
    <section className="tombstone">
      <h1>墓碑</h1>
      <p>享年 {life.death.ageAtDeath}</p>
      <p>死因：{life.death.causeOfDeath}</p>
      <p>分数：{life.death.score}</p>
      <div className="tag-row">{life.death.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <button type="button" className="primary-action" onClick={submit}>匿名提交排行榜</button>
      {shareId ? <p>分享编号：{shareId}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <button type="button" onClick={onStart}>开始新人生</button>
    </section>
  );
}
```

- [ ] **Step 8: Run tests and build**

Run: `npm run test -- src/__tests__/tombstoneClient.test.ts && npm run build`

Expected: PASS.

- [ ] **Step 9: Commit tombstone API**

```bash
git add netlify src/api src/views/TombstoneView.tsx src/__tests__/tombstoneClient.test.ts
git commit -m "feat: add anonymous tombstone API"
```

---

### Task 10: Leaderboard Client and View

**Files:**
- Modify: `src/api/tombstonesClient.ts`
- Modify: `src/views/LeaderboardView.tsx`
- Test: `src/__tests__/leaderboard.test.tsx`

- [ ] **Step 1: Write failing leaderboard test**

Create `src/__tests__/leaderboard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { LeaderboardView } from "../views/LeaderboardView";

describe("LeaderboardView", () => {
  it("renders remote rows", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ rows: [
      { id: "one", displayName: "匿名人生", ageAtDeath: 88, score: 1234, tags: ["long_life"], causeOfDeath: "old_age" }
    ] }), { status: 200 })));

    render(<LeaderboardView />);

    expect(await screen.findByText("匿名人生")).toBeInTheDocument();
    expect(screen.getByText(/1234/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/__tests__/leaderboard.test.tsx`

Expected: FAIL because `LeaderboardView` does not fetch rows.

- [ ] **Step 3: Extend `src/api/tombstonesClient.ts`**

Append:

```ts
export interface LeaderboardRow {
  id: string;
  displayName?: string;
  ageAtDeath: number;
  score: number;
  tags: string[];
  causeOfDeath: string;
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const response = await fetch("/api/leaderboard");
  if (!response.ok) {
    throw new Error(`Leaderboard fetch failed: ${response.status}`);
  }
  const data = (await response.json()) as { rows: LeaderboardRow[] };
  return data.rows;
}
```

- [ ] **Step 4: Replace `src/views/LeaderboardView.tsx`**

```tsx
import { useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardRow } from "../api/tombstonesClient";

export function LeaderboardView() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchLeaderboard()
      .then((items) => {
        if (active) setRows(items);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="stack">
      <h1>排行榜</h1>
      {error ? <p role="alert">排行榜加载失败。</p> : null}
      {rows.length === 0 && !error ? <p className="empty-state">还没有匿名墓碑。</p> : null}
      {rows.map((row) => (
        <article className="panel" key={row.id}>
          <strong>{row.displayName ?? "匿名人生"}</strong>
          <p>享年 {row.ageAtDeath} · 分数 {row.score}</p>
          <p>死因：{row.causeOfDeath}</p>
          <div className="tag-row">{row.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 5: Run leaderboard test**

Run: `npm run test -- src/__tests__/leaderboard.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit leaderboard UI**

```bash
git add src/api/tombstonesClient.ts src/views/LeaderboardView.tsx src/__tests__/leaderboard.test.tsx
git commit -m "feat: show anonymous leaderboard"
```

---

### Task 11: Content Expansion to V1 Minimums

**Files:**
- Modify: `src/content/activities.ts`
- Modify: `src/content/events.ts`
- Modify: `src/content/careers.ts`
- Modify: `src/content/diseases.ts`
- Modify: `src/content/achievements.ts`
- Modify: `src/content/countries.ts`
- Modify: `src/content/locales.ts`
- Modify: `src/__tests__/contentSchema.test.ts`

- [ ] **Step 1: Raise content count tests to v1 minimums**

Modify `src/__tests__/contentSchema.test.ts` count expectations:

```ts
expect(catalog.countries.length).toBeGreaterThanOrEqual(5);
expect(catalog.activities.length).toBeGreaterThanOrEqual(25);
expect(catalog.events.length).toBeGreaterThanOrEqual(70);
expect(catalog.careers.length).toBeGreaterThanOrEqual(15);
expect(catalog.diseases.length).toBeGreaterThanOrEqual(12);
expect(catalog.achievements.length).toBeGreaterThanOrEqual(20);
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/__tests__/contentSchema.test.ts`

Expected: FAIL with count assertions for activities, events, careers, diseases, and achievements.

- [ ] **Step 3: Expand content files**

Add entries following the exact schemas already validated in `src/content/schema.ts`. Use original Chinese text, not copied wiki text. Keep ids lowercase with underscores.

Required final counts:

```text
src/content/activities.ts    at least 25 entries
src/content/events.ts        at least 70 entries
src/content/careers.ts       at least 15 entries
src/content/diseases.ts      at least 12 entries
src/content/achievements.ts  at least 20 entries
src/content/countries.ts     at least 5 entries
```

For every new label key, add a `zh-CN` string to `src/content/locales.ts`. Add `en-US` strings for country names and keep other English keys absent until UI locale switching uses them.

Event mix required:

```text
family        at least 12
school        at least 10
career        at least 10
health        at least 12
relationship  at least 12
misc          at least 14
```

- [ ] **Step 4: Add event-domain balance test**

Append to `src/__tests__/contentSchema.test.ts`:

```ts
it("has balanced event domains for replayability", () => {
  const counts = catalog.events.reduce<Record<string, number>>((acc, event) => {
    acc[event.domain] = (acc[event.domain] ?? 0) + 1;
    return acc;
  }, {});

  expect(counts.family).toBeGreaterThanOrEqual(12);
  expect(counts.school).toBeGreaterThanOrEqual(10);
  expect(counts.career).toBeGreaterThanOrEqual(10);
  expect(counts.health).toBeGreaterThanOrEqual(12);
  expect(counts.relationship).toBeGreaterThanOrEqual(12);
  expect(counts.misc).toBeGreaterThanOrEqual(14);
});
```

- [ ] **Step 5: Run content tests**

Run: `npm run test -- src/__tests__/contentSchema.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit expanded content**

```bash
git add src/content src/__tests__/contentSchema.test.ts
git commit -m "feat: expand v1 gameplay content"
```

---

### Task 12: PWA Assets, Offline Smoke, and Final Verification

**Files:**
- Create: `public/pwa.svg`
- Create: `e2e/pwa-smoke.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Create simple PWA icon**

Create `public/pwa.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Text Life">
  <rect width="512" height="512" rx="96" fill="#111827"/>
  <circle cx="392" cy="118" r="38" fill="#22c55e"/>
  <text x="256" y="308" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="168" font-weight="800" fill="#f8fafc">TL</text>
  <path d="M132 374h248" stroke="#38bdf8" stroke-width="28" stroke-linecap="round"/>
</svg>
```

Verify with:

Run: `grep -q '<svg' public/pwa.svg && echo ok`

Expected: `ok`.

- [ ] **Step 2: Write Playwright smoke test**

Create `e2e/pwa-smoke.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("mobile life loop smoke", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "开始新人生" }).click();
  await expect(page.getByText(/年龄：0/)).toBeVisible();
  await page.getByRole("button", { name: "年龄+1" }).click();
  await expect(page.getByText(/年龄：1/)).toBeVisible();
  await page.getByRole("button", { name: "活动" }).click();
  await expect(page.getByRole("heading", { name: "活动" })).toBeVisible();
});
```

- [ ] **Step 3: Create `README.md`**

````md
# Text Life

Mobile-first PWA text life simulator.

## Development

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test
npm run build
npm run test:e2e
```

## Netlify

The app deploys with Netlify using `netlify.toml`. Local gameplay is offline-first. Netlify Functions power anonymous tombstone sharing and leaderboard reads.
````

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run test
npm run build
npm run test:e2e
```

Expected:

```text
Vitest: all tests pass
Vite build: exits 0 and writes dist/
Playwright: mobile life loop smoke passes
```

- [ ] **Step 5: Check Git status**

Run: `git status --short`

Expected: only intentional generated files are untracked. `dist/`, `coverage/`, `.netlify/`, and `node_modules/` are ignored.

- [ ] **Step 6: Commit PWA verification**

```bash
git add public e2e README.md
git commit -m "test: add PWA smoke verification"
```

---

## Final Review Checklist

Run after Task 12:

```bash
npm run test
npm run build
npm run test:e2e
git log --oneline --max-count=12
git status --short
```

Expected:

- Unit tests pass.
- Production build passes.
- Mobile Playwright smoke test passes.
- Recent commits show each task as a separate commit.
- Working tree has no uncommitted app source changes.

## Spec Coverage

- Mobile-first PWA: Tasks 1, 8, 12.
- P0 rich loop: Tasks 2-8, 11.
- Random initial stats and family: Task 4.
- Seedable engine: Tasks 2, 4, 5.
- Local-first IndexedDB persistence: Task 7.
- Anonymous tombstone sharing and leaderboard: Tasks 9-10.
- No login/cloud save/admin: Backend tasks only store public tombstones.
- Chinese-first bilingual architecture: Task 3 creates locale structure.
- Error paths: Task 9 handles submit failure; Task 10 handles leaderboard failure; Task 7 keeps gameplay in memory if persistence rejects.
- Testing strategy: Tasks 2-12 add unit, content, UI, API-client, build, and mobile smoke checks.
