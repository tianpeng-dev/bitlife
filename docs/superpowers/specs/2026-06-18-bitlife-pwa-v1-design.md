# BitLife-like PWA v1 Design

Date: 2026-06-18
Status: Approved design draft for implementation planning

## Goal

Build the first playable version of a mobile-first PWA text life simulator inspired by the feature matrix in `/Users/peng/Documents/Project/bitlife/docs/design/bitlife-feature-matrix.md`.

The first version should be a complete playable loop rather than a technical demo: a player can start a random life, advance year by year, make choices, experience changing stats and relationships, die, receive a tombstone summary, and optionally submit an anonymous result to a leaderboard.

The project must not copy original BitLife event text, challenge names, brand-specific expressions, or proprietary presentation. Wiki data is used as design reference only.

## Confirmed Product Decisions

- App shape: mobile-first Web/PWA.
- First-version completeness: P0 rich loop.
- Backend level: light backend only.
- Backend feature: anonymous tombstone sharing and leaderboard.
- Account model: no login in v1.
- Initial stats: randomized for every new life.
- Language strategy: Chinese content first, bilingual architecture from the start.
- Deployment/data platform: Netlify-first, using Netlify Functions and Netlify Database or Netlify Blobs.

## V1 Scope

### Included

- Age progression and lifecycle from birth to death.
- Core stats: happiness, health, smarts, looks, cash.
- Randomized starting identity, country/city, family background, and initial stats.
- Family and relationship model for parents, siblings, friends, lovers, and children.
- Education and career progression.
- Activity system covering study, exercise, doctor visits, social actions, dating, job actions, and a small number of risk actions.
- Health and disease model with treatment, worsening, and death risk.
- Random event system keyed by age, stage, status, stats, relationships, and current life context.
- Death summary, tombstone tags, first achievement/ribbon-like labels, and anonymous leaderboard submission.
- PWA install/offline shell and local save persistence.

### Excluded From V1

- Full asset/economy simulation.
- Deep crime and prison systems.
- Social media gameplay.
- Royalty, mafia, sports, music, and other special identity tracks.
- Challenges or daily scenarios.
- Login, accounts, cloud saves, and user profiles.
- Content management backend.
- Admin dashboard.

## Technical Stack

- Frontend: Vite, React, TypeScript.
- PWA: `vite-plugin-pwa` or equivalent Workbox-based Vite integration.
- State management: Zustand.
- Local persistence: IndexedDB.
- Simulation engine: pure TypeScript modules with no React dependency.
- Content data: local TypeScript or JSON catalogs.
- Localization: string keys with `zh-CN` and `en-US` support. V1 content ships primarily in Chinese, but data structures must support English strings.
- Backend: Netlify Functions.
- Backend storage: Netlify Database preferred for leaderboard queries. Netlify Blobs is acceptable for share snapshots or as a fallback if database setup blocks implementation.

## Architecture

### Simulation Engine

The simulation engine owns game rules. It receives the current life state, content catalogs, and a seedable RNG, then returns the next state plus logs, triggered events, activity results, death results, or tombstone tags.

The engine must stay independent from React and browser APIs so it can be unit-tested directly.

Responsibilities:

- New life generation.
- Yearly age-up.
- Passive stat drift.
- Relationship drift.
- Stage transitions.
- Event selection.
- Activity resolution.
- Education and career updates.
- Disease progression.
- Death checks.
- Tombstone and achievement tag calculation.

### Content Catalog

The content catalog defines data-driven rules and copy:

- Events.
- Event options.
- Activities.
- Careers.
- Education stages.
- Diseases.
- Countries and simple country rules.
- Achievements/tombstone tags.
- Localization strings.

Catalog entries should use stable ids and schema validation. Content must not be hardcoded in UI components.

### Game State Store

The front-end store manages:

- Current life.
- Current event pending player choice.
- Visible logs.
- UI navigation state.
- Local save/load status.
- Death summary state.

The store calls the simulation engine but does not implement rule logic.

### Persistence Layer

IndexedDB stores:

- Current active life.
- Recent life history.
- Tombstone summaries awaiting optional submission.
- User preferences such as language.

The game must remain playable offline. Network features should fail gracefully.

### Backend API

Netlify Functions provide:

- `POST /api/tombstones`: accepts an anonymous death summary, validates it, calculates or verifies the public score, stores it, and returns a `shareId`.
- `GET /api/tombstones/:id`: returns a public tombstone snapshot.
- `GET /api/leaderboard`: returns public leaderboard rows with sorting and pagination.

The backend does not store full active saves in v1.

## Data Flow

1. Player starts a new life.
2. Frontend creates a seed and calls the engine to generate randomized initial state.
3. State is saved locally in IndexedDB.
4. Player taps the age-up action once per year.
5. Store calls the engine with current state, catalog, and seeded RNG.
6. Engine returns state changes, logs, and optionally an event requiring a player choice.
7. UI renders updated stats, relationships, logs, and available actions.
8. If the character dies, engine creates a death summary and tombstone tags.
9. Player can keep the tombstone local or submit it anonymously.
10. Netlify Function validates and stores the tombstone, then returns a share id.
11. Leaderboard reads public tombstone rows only.

## Random Generation

Every new life starts with randomized values:

- Name.
- Gender.
- Country and city.
- Family economic tier.
- Parents and siblings.
- Parent traits, generosity, wealth, and relationship values.
- Core stats: happiness, health, smarts, looks.

Randomness must be generated from a seedable RNG. The same seed should be reproducible for debugging.

Initial stat ranges should allow rare extreme lives without making most starts unplayable. Extremely low or high starts are allowed but should be uncommon.

## Content Targets

V1 should aim for enough content to feel replayable while staying maintainable:

- 25-35 activities.
- 70-100 random events.
- 15-25 generic careers.
- 12-20 disease categories.
- 20-30 tombstone/achievement tags.
- 5-8 countries with simple rule differences.

Age stages:

- `0-5`: early childhood.
- `6-12`: childhood.
- `13-17`: teen.
- `18-64`: adult.
- `65+`: elder.

Each stage should have distinct event pools and action availability.

## Mobile UI

The UI is designed primarily for phone screens.

Primary views:

- Current Life: name, age, country, identity summary, stat bars, cash, yearly log, and a fixed age-up action.
- Event: short prompt plus 2-4 choices; choice result immediately appears in the log.
- Activities: grouped activity list for mind/body, relationships, education/career, health, leisure, and risk actions.
- Relationships: family, friends, lover/spouse, and children with relationship values and a small set of interactions.
- Education/Career: current school, degree, job, salary, performance, and available actions.
- Tombstone: age at death, cause of death, summary, tags, stats, anonymous submit action, and new life action.
- Leaderboard: anonymous tombstone rows with sort options.

Interaction principles:

- Every age-up should produce visible change.
- Event text should be short and mobile-readable.
- Activity lists should be scannable and shallow.
- Death should feel like a reward and replay hook, not only failure.
- Offline mode should preserve local play and show retry states for network features.

## Backend Data and Safety

The anonymous tombstone payload should include only public gameplay summary fields:

- `seed`.
- `ageAtDeath`.
- `causeOfDeath`.
- `summary`.
- `tags`.
- `score`.
- `stats`.
- `netWorth`.
- `careerTitle`.
- `highestEducation`.
- `createdAt`.
- Optional display name generated by the game or typed by the player with length limits.

Validation rules:

- Validate request schema server-side.
- Enforce string length limits.
- Enforce numeric bounds.
- Reject incomplete or non-death submissions.
- Recalculate or sanity-check score server-side.
- Store only public tombstone data.

V1 does not implement accounts, private profiles, or cloud saves.

## Error Handling

- IndexedDB failure: show a clear local-save warning and keep the in-memory life playable.
- Content catalog missing id: throw in development; use a generic fallback in production only when safe.
- Backend submit failure: keep tombstone local and allow retry.
- Leaderboard failure: show an empty/error state and leave local gameplay untouched.
- Offline: disable or queue submit actions; local game remains playable.
- Invalid server response: ignore the response and preserve local state.

## Testing Strategy

### Simulation Engine

- Seeded generation is reproducible.
- New life stats stay within bounds.
- Age-up increments correctly.
- Stat drift remains within `0-100`.
- Relationship drift works.
- Education and career gates work.
- Disease progression can recover, worsen, or kill.
- Death creates a valid tombstone.
- Achievement/tag calculation is deterministic.

### Content Validation

- Events, activities, careers, diseases, countries, and tags pass schema checks.
- Referenced ids exist.
- Localization keys exist for supported locales.
- Event choices have valid effects.

### API

- Valid tombstone submission returns share id.
- Invalid payload is rejected.
- Leaderboard sorting and pagination work.
- Single tombstone lookup works.
- Public responses do not leak private/local save data.

### Frontend/PWA

- Start new life.
- Advance through multiple years.
- Resolve an event choice.
- Use at least one activity.
- Reach death through a controlled test scenario.
- Submit tombstone anonymously.
- Read leaderboard.
- Verify mobile viewport does not overflow.
- Verify offline shell loads after install/cache.

## Implementation Constraints

- Do not implement app code until this design is reviewed and an implementation plan is approved.
- Keep simulation logic separate from UI.
- Keep content data separate from engine code.
- Prefer small modules with clear interfaces.
- Use local-first gameplay; backend features must not block the main loop.

## Source References

- Feature matrix: `/Users/peng/Documents/Project/bitlife/docs/design/bitlife-feature-matrix.md`
- Core gameplay spec: `/Users/peng/Documents/Project/bitlife/docs/design/bitlife-core-spec.md`
- Local wiki index: `/Users/peng/Documents/Project/bitlife/data/wiki_reference/index.json`
- Netlify Functions docs: `https://docs.netlify.com/build/functions/overview/`
- Netlify Database docs: `https://docs.netlify.com/build/data-and-storage/netlify-database/`
- Netlify Blobs docs: `https://docs.netlify.com/build/data-and-storage/netlify-blobs/`
