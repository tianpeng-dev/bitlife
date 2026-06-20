# BitLife-like PWA Complete P1 Design

Date: 2026-06-20
Status: Approved design draft for implementation planning

## Goal

Build a complete P1 expansion for the existing mobile-first Text Life PWA. The expansion adds the full P1 set from `/Users/peng/Documents/Project/bitlife/docs/design/bitlife-feature-matrix.md` in one large version:

- Assets and richer money systems.
- Romance, marriage, fertility, children, divorce, and adoption.
- Crime.
- Justice and prison.
- Countries and law.
- Fame.
- Social media.
- Pets.
- Travel, legal emigration, illegal emigration, and deportation.

This P1 version is a local research-oriented expansion. It prioritizes broad coverage of the local BitLife Wiki research copy and automated content generation over hand-polished authored content.

The project must not directly copy original game text, proprietary challenge names, brand-specific expressions, or uniquely identifiable event wording. The implementation may closely model mechanisms, categories, triggers, state relationships, and risk/reward structures from the local reference material, but visible copy and ids must pass the generation and scanning pipeline described below.

## Confirmed Product Decisions

- P1 delivery shape: one large version, not a series of smaller shipped vertical slices.
- Completeness target: systems complete and content-rich.
- Technology strategy: keep the existing stack.
- Content source strategy: local research prototype, with mechanics and coverage closely informed by the local wiki reference copy.
- Content quantity: maximize coverage of P1 reference categories from the local dataset; do not set a fixed item ceiling.
- Content production: generate catalog entries and bilingual copy as automatically as practical.
- Content quality gate: automated validation passing is enough for inclusion; humans review generation failures and obvious defects.
- Languages: complete `zh-CN` and `en-US` coverage for P1 visible content.
- Backend scope: keep the game local-first; backend remains anonymous tombstone sharing and leaderboard only.
- UI strategy: retain current bottom navigation and place P1 systems in existing views through groups, detail panels, and modal flows.
- Testing strategy: data-driven heavy validation plus core gameplay and mobile smoke tests.

## Current Project Context

The project already uses:

- Frontend: Vite, React, TypeScript.
- State: Zustand.
- Local persistence: IndexedDB.
- Backend: Netlify Functions and Netlify Blobs for tombstones and leaderboard.
- Validation: Zod.
- Tests: Vitest, Testing Library, and Playwright.
- Domain style: pure TypeScript simulation modules independent from React.

The current code has a playable P0-style loop with life generation, age progression, stats, activities, events, education/career, diseases, tombstone scoring, local persistence, and anonymous leaderboard sharing. P1 should extend that architecture instead of replacing it.

The working tree currently includes many unrelated untracked duplicate files with names containing ` 2` or ` 3`. The P1 implementation plan must avoid staging or modifying those unless the user explicitly requests cleanup.

## Technical Stack

Keep the existing stack:

- Vite.
- React.
- TypeScript.
- Zustand.
- IndexedDB.
- Zod.
- Vitest.
- Playwright.
- Netlify Functions.
- Netlify Blobs.

Do not migrate to Next.js, add accounts, add cloud saves, introduce a remote content management backend, or replace the local-first architecture for P1.

## Architecture Overview

P1 should move from a mostly centralized simulation engine to a core engine plus isolated domain modules.

The core engine remains responsible for:

- New life generation.
- Seeded randomness.
- Yearly age progression.
- Activity dispatch.
- Event dispatch and choice resolution.
- Death checks.
- Tombstone and achievement/tag calculation.
- Log creation.
- Calling yearly ticks for domain modules.

P1 domain modules own their own state transitions and validation rules. They must not import React or browser APIs. Each module receives life state, relevant catalog data, RNG/context, and action input, then returns updated state, logs, pending events, or typed errors.

## P1 Domain Modules

### Assets

Adds owned assets and richer money goals.

Responsibilities:

- Asset catalogs for homes, vehicles, jewelry, instruments, boats, planes, and other valuables.
- Buying, selling, gifting, maintaining, repairing, and using assets.
- Asset condition, purchase price, current value, debt/loan metadata where modeled, ownership source, stolen flag, and market modifiers.
- Yearly depreciation or appreciation.
- Random asset events such as theft, accident, breakdown, maintenance failure, windfall value increase, and legal seizure.
- Net worth calculation that includes cash and asset value.

### Romance And Family

Deepens the relationship model into long-running family arcs.

Responsibilities:

- Dating and relationship formation.
- Lover, spouse, ex, child, and co-parent relationship states.
- Proposal, marriage, wedding, divorce, reconciliation, and breakups.
- Pregnancy, miscarriage risk, birth, fertility treatment, adoption, child support, inheritance hooks, and family conflict.
- Partner and child events that affect happiness, cash, relationships, assets, crime, and ending tags.

### Crime And Justice

Adds high-risk/high-reward illegal actions and legal consequences.

Responsibilities:

- Crime type catalog with age, country, status, opportunity, and stat requirements.
- Risk/reward resolution including success, failure, injury, death, cash gain/loss, evidence, wanted status, and arrest.
- Criminal record, charges, conviction history, and career restrictions.
- Sentencing based on country law, crime severity, repeat offenses, evidence, and randomness.
- Hooks into prison state and tombstone/achievement tags.

### Prison

Turns incarceration into an alternate ruleset rather than a simple disabled state.

Responsibilities:

- Prison state with sentence length, remaining years, security level, behavior, respect, health effects, and incarceration history.
- Prison-specific activities such as appeal, parole, prison work, exercise, study, visitation, contraband risk, riot participation, and escape attempts.
- Yearly prison tick for sentence progress, prison events, family drift, health risk, and release.
- Activity gating so ordinary life actions are disabled or replaced while imprisoned.

### Countries And Law

Makes country choice meaningful across P1 systems.

Responsibilities:

- Country law tables for adult age, marriage rules, gambling, healthcare cost, immigration difficulty, crime penalties, prison severity, and available activities.
- Country market modifiers for assets, jobs, healthcare, pets, travel, and fame/social media availability.
- Runtime checks used by activities, events, crime, migration, romance, and prison.
- Clear reason messages when an activity is unavailable because of country law.

### Fame And Social Media

Adds late-game growth loops and public reputation risk.

Responsibilities:

- Fame state with source, fame score, public sentiment, decay, and eligibility rules.
- Fame activities such as interview, ad, book, appearance, scandal response, and public charity.
- Social media accounts with platform id, followers, verification, monetization, ban status, recent post outcomes, and risk modifiers.
- Posting, streaming, promotion, buying followers, deleting account, replying to famous people, and scandal/ban outcomes.
- Hooks into careers, relationships, cash, happiness, crime, and tombstone tags.

### Pets

Adds companion relationships with cost and lifecycle.

Responsibilities:

- Pet catalog with species/type, rarity, price range, lifespan, behavior traits, care cost, and country/shop availability.
- Adoption or purchase, care, training, vet visits, selling, surrendering, escape, attack, illness, and death.
- Pet relationship, health, age, and household effects.
- Pet events that affect happiness, relationships, cash, health, and death summaries.

### Travel And Migration

Adds country-changing actions and travel risk.

Responsibilities:

- Local travel, vacation, honeymoon, legal emigration, illegal emigration, deportation, and return travel.
- Visa/emigration result calculation based on cash, criminal record, country rules, family status, age, career, and randomness.
- Country transitions that affect career, legal status, relationships, assets, and activity availability.
- Migration history for future events and tombstone tags.

## Life State Changes

Extend `LifeState` with serializable P1 state blocks:

- `assets`.
- `legal`.
- `prison`.
- `fame`.
- `socialAccounts`.
- `pets`.
- `migrationHistory`.
- Expanded family/relationship metadata.
- Catalog/content version.
- Save schema version.

All new fields must be defaultable so old local saves can migrate safely. IndexedDB persistence should include a save migration layer that upgrades missing P1 blocks when loading older lives.

`Person` can continue to represent human relationships but should gain explicit relationship metadata for lover, spouse, ex, child, co-parent, marital status, pregnancy linkage, and dependency relationships. Pets should use a separate `Pet` model rather than being forced into `Person`.

## Content Architecture

P1 catalog content should be modular and generated-friendly.

Recommended structure:

```text
src/content/generated/p1/
  assets.generated.ts
  romanceFamily.generated.ts
  crimes.generated.ts
  prison.generated.ts
  countriesLaw.generated.ts
  fameSocial.generated.ts
  pets.generated.ts
  travelMigration.generated.ts

src/content/overrides/p1/
  assets.ts
  romanceFamily.ts
  crimes.ts
  prison.ts
  countriesLaw.ts
  fameSocial.ts
  pets.ts
  travelMigration.ts

src/content/schema.ts
src/content/catalog.ts
src/content/locales.ts
```

Generated files contain machine-produced playable entries. Override files contain balancing corrections, disabled entries, rewritten text, and hand-authored fixes. `catalog.ts` merges P0 content, P1 generated content, and P1 overrides, then runs validation.

Each module must own a Zod schema for its entries. The combined catalog validator must also verify cross-module references.

## Content Generation Pipeline

Input boundary:

- `/Users/peng/Documents/Project/bitlife/data/wiki_reference/index.json`
- `/Users/peng/Documents/Project/bitlife/data/wiki_reference/index.csv`
- P1 reference pages named in `/Users/peng/Documents/Project/bitlife/docs/design/bitlife-feature-matrix.md`
- Local `content.txt` and `content.wikitext` files under `data/wiki_reference/pages`

The pipeline should:

1. Read the local reference index and resolve P1 pages.
2. Extract headings, lists, tables, categories, page titles, and mechanism keywords.
3. Generate a coverage manifest per P1 module.
4. Generate draft catalog entries with stable ids, requirements, effects, weights, ranges, and source metadata.
5. Generate `zh-CN` and `en-US` visible copy.
6. Run schema, locale, reference, numeric, reachability, duplicate, forbidden expression, and basic similarity checks.
7. Write generated `.ts` catalog files only when validation passes.

The pipeline may preserve source metadata for traceability, but source snippets must not be surfaced in gameplay copy.

## Bilingual Requirements

P1 content must include complete `zh-CN` and `en-US` visible strings for:

- Activity labels.
- Event prompts.
- Event choice labels.
- Event result/log text.
- Asset names and descriptions.
- Crime names and result text.
- Prison actions and events.
- Country/law labels and unavailability reasons.
- Fame and social media actions/results.
- Pet names/types/actions/events.
- Travel and migration actions/results.
- Achievements, tombstone tags, and summaries.

Locale validation should fail if any visible P1 key is missing, empty, or still contains an explicit placeholder marker such as `TODO`, `TBD`, `PLACEHOLDER`, or `FIXME`.

## Runtime Data Flow

### Age Up

On yearly age-up, the core engine should:

1. Increment age and stage.
2. Apply base stat drift.
3. Progress education and career.
4. Run P1 yearly ticks in a deterministic order:
   - romance/family pregnancy and child aging.
   - assets depreciation/appreciation and maintenance events.
   - pets aging, health, and events.
   - legal/wanted status and prison sentence progression.
   - country/law checks.
   - fame decay and social account drift.
   - travel/migration follow-up consequences.
5. Collect module logs and candidate events.
6. Select or queue events using seeded randomness.
7. Check death.
8. Persist state locally.

### Activity

`performActivity` should dispatch by module:

- Asset actions to `assets`.
- Dating, marriage, fertility, divorce, and adoption to `romanceFamily`.
- Crimes and legal actions to `crimeJustice`.
- Prison actions to `prison`.
- Fame and social actions to `fameSocial`.
- Pet actions to `pets`.
- Travel and migration actions to `travelMigration`.
- Existing P0 activities to the current general activity resolver.

Unavailable activities return user-facing reason codes rather than generic errors.

### Events

P1 modules can contribute eligible events based on age, country, state, relationships, legal status, prison state, fame, assets, pets, and migration history. The core engine remains responsible for final event selection and choice resolution.

## UI And Interaction Design

Keep the existing bottom navigation. Do not add many new top-level tabs.

### Life View

Show a compact P1 status summary:

- Cash and net worth.
- Country and important law state.
- Marriage/partner/children summary.
- Asset count and most valuable asset.
- Criminal record, wanted, or prison status.
- Pet summary.
- Fame/social summary when present.

### Activities View

Upgrade the current flat activity list into grouped, filterable sections:

- Mind and body.
- Relationships.
- Education and career.
- Health.
- Leisure.
- Risk.
- Assets.
- Crime.
- Law and prison.
- Fame.
- Social media.
- Pets.
- Travel and migration.

Activity cards should show availability, cost, risk, age lock, country lock, cooldown, and this-year completion where relevant. Sort available and highly relevant actions before unavailable actions. Large generated lists should be collapsible or paginated by group.

### Relationships View

Group relationships into:

- Family.
- Partner/spouse.
- Exes.
- Children.
- Friends.
- Pets.

Cards should lead to detail panels for interactions. Do not place every possible action on the list card.

### Career View

Continue showing school/career state. Add fame surfaces only when fame is available:

- Fame score.
- Public sentiment.
- Social media summary.
- Fame actions and recent public outcomes.

### Prison State

When imprisoned, life and activities views enter prison mode:

- Most ordinary activities become unavailable.
- Prison actions replace normal actions.
- Age-up still progresses sentence and prison events.
- Release restores normal activity availability.

### Error And Fallback Behavior

- Missing required catalog data fails in development and tests.
- In runtime prototype builds, invalid generated entries can be hidden if the catalog loader marks them disabled.
- Activity denial should explain the reason: age, law, cash, prison, relationship state, pregnancy state, fame state, banned account, pet ownership, or migration status.
- Local save migration failure should preserve the old save and offer starting a new life rather than corrupting data.

## Backend Scope

P1 does not add accounts, cloud saves, real online social features, remote catalogs, admin tools, or user profiles.

Netlify Functions continue to provide:

- Anonymous tombstone submission.
- Single tombstone lookup.
- Public leaderboard list.

P1 tombstone payloads may include new public summary fields such as net worth, family summary, criminal history summary, fame score, pet count, country count, and prison years. Server validation must bound these fields and continue to avoid storing private active save data.

## Testing And Validation

Use data-driven heavy validation.

### Unit Tests

Add deterministic tests for:

- Asset purchase, sale, value change, and maintenance.
- Dating, marriage, divorce, pregnancy, birth, adoption, and child aging.
- Crime success, failure, arrest, conviction, and record effects.
- Prison entry, yearly sentence progress, appeal, parole, escape, and release.
- Country law differences affecting activity availability and sentencing.
- Fame unlock, decay, public actions, and consequences.
- Social media posting, followers, monetization, verification, and bans.
- Pet acquisition, care, sickness, aging, and death.
- Travel, legal emigration, illegal emigration, rejection, and deportation.
- Old-save migration to P1 state.

### Catalog Validation Tests

Validation must cover:

- Zod schema conformance.
- Unique ids across each catalog category.
- Complete `zh-CN` and `en-US` visible keys.
- Cross-reference integrity.
- Numeric bounds for stats, cash, assets, debt, sentences, followers, fame, pet age, pregnancy, and weights.
- Reachability of important actions and events.
- State machine sanity: dead characters cannot act, imprisoned characters use prison rules, pregnancy resolves, prison releases can happen, banned accounts cannot post, deported characters receive valid country state.
- Duplicate generated content detection.
- Forbidden expression and basic similarity scanning against local reference text.
- Generated source metadata presence.

### Integration Tests

Run fixed-seed multi-year simulations that cover:

- Ordinary adult life with assets, marriage, children, and pets.
- Crime into conviction, prison, release, and later life.
- Migration changing country rules.
- Fame and social media growth, monetization, and scandal/ban.
- Death and tombstone scoring with P1 summary fields.

### E2E Smoke Tests

Extend mobile Playwright smoke coverage:

- Start a life, age up, perform a P1 activity, and see the log update.
- Buy an asset, start a relationship, and have a child.
- Commit a crime, enter prison, perform a prison action, and eventually release or die.
- Emigrate and confirm country-sensitive activity changes.
- Use fame/social actions when eligible.
- Get a pet and see it in relationship/pet UI.
- Die, view tombstone, and verify leaderboard still loads.

## Acceptance Criteria

P1 is acceptable when:

- All P1 modules listed in this spec exist as domain modules or clearly isolated resolvers.
- Generated P1 content is loaded through module catalogs and validated before runtime.
- P1 visible content has complete `zh-CN` and `en-US` coverage.
- P1 activity and event availability respects age, country, prison, relationship, fame, pet, asset, legal, and migration state.
- Age-up can run long fixed-seed simulations without uncaught errors.
- Old P0 saves migrate to valid P1 state or fail gracefully without data corruption.
- Tombstones still work locally and through the existing anonymous backend.
- Unit, catalog validation, integration, and mobile smoke tests pass.
- No generated gameplay text directly copies original reference wording, proprietary challenge names, brand-specific expressions, or uniquely identifiable event wording according to the automated scanners.

## Explicit Non-Goals

- Accounts or login.
- Cloud saves.
- Remote content management.
- Admin dashboard.
- Real online social networking.
- Payment or monetization systems.
- P2 special identities such as royalty, mafia, sports, or music as deep dedicated tracks.
- P2 challenges or daily scenarios.
- Full mini-game implementations.
- Public release polish pass for all generated content.

## Risks And Mitigations

### Large Scope

Risk: implementing complete P1 as one version will be long and regression-prone.

Mitigation: keep strict module boundaries, use generated coverage manifests, and require heavy catalog validation.

### Generated Content Quality

Risk: automated content may be repetitive, awkward, imbalanced, or tonally inconsistent.

Mitigation: validate structure and bounds automatically, allow overrides, and accept that this P1 is a research prototype rather than a polished public content release.

### Similarity And Copying Risk

Risk: generation from local reference text may accidentally preserve identifiable wording.

Mitigation: run forbidden expression and basic similarity scans; avoid direct source snippets in gameplay copy; require generated text to be rewritten rather than copied.

### State Complexity

Risk: P1 state blocks can make `LifeState` large and hard to reason about.

Mitigation: isolate module state, module reducers/resolvers, and tests. Keep all state serializable and versioned.

### Save Migration

Risk: old IndexedDB saves may be missing P1 fields.

Mitigation: add save schema versioning and default migrations before P1 state is read by the engine.

### Dirty Working Tree

Risk: unrelated duplicate untracked files may pollute commits and tests.

Mitigation: implementation tasks must stage explicit files only and should add ignore or cleanup steps only with user approval.

## Implementation Planning Notes

The implementation plan should start with foundations:

1. Add P1 save-state versioning and domain module scaffolding.
2. Add expanded catalog schemas and validation tests.
3. Build the content generation pipeline and coverage manifests.
4. Implement P1 domain modules in dependency order: countries/law, assets, romance/family, pets, crime/justice/prison, travel/migration, fame/social.
5. Upgrade UI grouping and detail panels.
6. Extend tombstones and leaderboard schema safely.
7. Add fixed-seed integration tests and mobile smoke flows.

The next required step after this design is a detailed implementation plan using the `superpowers:writing-plans` skill.
