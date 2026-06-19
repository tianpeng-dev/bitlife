# BitLife-like Core Gameplay Spec (v0.1)

## 1. Goal
Build a text-first life simulator with:
- one-year turns from birth to death
- many choices each turn
- strange/chaotic outcomes
- high replayability via randomness + branching systems

This spec is extracted from local reference pages downloaded from BitLife wiki seeds (`Stats`, `Activities`) and their linked pages.

## 2. Simulation Loop
Per year, run in this order:
1. Advance age by 1.
2. Apply passive drifts (stats decay/recovery, relationship drift, disease progression, fame drift).
3. Resolve mandatory lifecycle transitions (school stage, retirement pressure, legal adulthood gates).
4. Roll random events (childhood, school, relationship, crime witness, health, work, prison, etc).
5. Present player action menu (activities, relationships, work, crime, mind/body, assets, prison actions if incarcerated).
6. Resolve chosen actions and side effects.
7. Check terminal conditions (death, execution, fatal illness, severe incidents).
8. If alive, continue to next year.

## 3. State Model
### 3.1 Core Character
- identity: name, gender, country, city
- age: integer year-based
- alive: boolean
- incarceration state (none, juvenile, prison)
- flags: famous, royalty, criminal record, addictions, major illnesses

### 3.2 Stats
Primary bars (0-100):
- happiness
- health
- smarts
- looks

Optional bars by status:
- fame (for fame careers / social influence)
- approval (politics style variants)
- respect (prison/royalty contexts)

Extracted baseline ranges from wiki references:
- happiness: 50-100 at life start
- health: 80-100 at life start
- smarts: 0-100 at life start
- looks: 0-100 at life start

### 3.3 Relationships
Entities:
- parents, siblings, lovers/spouse, children, friends, coworkers/classmates, pets, exes

Each relation has:
- closeness (0-100)
- trust (0-100)
- conflict (0-100)
- relation-specific tags (spouse, step-family, gang ally, etc.)

Rule:
- relationship naturally drifts downward each year unless maintained.

### 3.4 Career / Education
- education stage progression (childhood school -> high school -> optional higher education)
- career with rank ladder, salary, performance, stress
- criminal record can block job opportunities
- emigration can force career reset/reselection

### 3.5 Finance / Assets
- cash + net worth
- owned assets (house, car, jewelry, aircraft, boat, instrument)
- recurring costs and maintenance
- house interactions can trigger events (party, police, drugs, accidents)

### 3.6 Health / Disease
- disease list with severity, chronic/acute, treatability
- yearly damage to health if untreated
- treatment attempts with probabilistic outcomes
- disease source tags (random, lifestyle, encounter, prison, age)

### 3.7 Crime / Legal / Prison
- crimes committed, conviction history, sentence years
- sentence escalates on repeat imprisonment (doubling behavior from source notes)
- prison security level affects escape difficulty
- prison-only actions (appeal, gang join, bribe, riot, infirmary, letter, escape)
- prison reputation/respect subsystem for gang eligibility and violence risk

### 3.8 Achievements / Ribbons
- end-of-life classification based on major life pattern
- ribbon scoring prioritizes extreme life signatures (family-focused, wealthy, criminal, famous, etc.)

## 4. Action System
Action availability is gated by:
- age
- country laws
- current status (in prison, married, employed, underage)
- required licenses / prerequisites

Examples from extracted references:
- crime has age-gated sub-actions
- adoption requires adulthood and often stable conditions
- social media / fame activities require enough visibility or fame context
- prison actions are only visible while incarcerated

Action result model:
- deterministic effect bundle + probabilistic side effects
- optional event chain continuation (e.g., failed crime -> arrest -> prison)

## 5. Event System
### 5.1 Event Architecture
Each event includes:
- trigger conditions
- weight/probability
- text prompt
- options (2-5 typical)
- effect payload per option
- optional delayed consequences

### 5.2 Event Domains
- childhood/school
- relationship conflict and infidelity
- career/work incidents
- health symptoms and diagnosis
- crime opportunities and witness situations
- prison incidents (assault, contraband, parole)
- fame incidents (paparazzi, insult, commercial offers)
- asset incidents (car crash, house complaint)

### 5.3 Strange Outcome Target
To keep "结果很怪":
- inject low-probability high-impact outcomes in each domain
- allow counterintuitive outcomes for some choices
- keep bounded chaos (no total nonsense): effects must map to known systems

## 6. Balancing Rules (Initial)
### 6.1 Passive Drift
- each year: slight random fluctuation on all bars
- health and happiness are most sensitive to disease, prison, relationship conflict
- looks declines with age trend but can be improved by some actions

### 6.2 Coupled Systems
- low happiness increases risky choices probability and bad event susceptibility
- low health increases death and severe disease risk
- high smarts improves education/career outcomes and some event odds
- fame amplifies both income opportunities and public backlash events

### 6.3 Death Conditions
Immediate death checks from:
- severe illness progression
- violence/accident outcomes
- prison execution in legal contexts
- old-age complication probability curve

## 7. Replayability Requirements
- randomized starting stats within configured ranges
- randomized family/economic background
- weighted event deck by age and context
- country/legal variation affecting available choices and penalties
- alternative life routes must remain viable: family, crime, fame, wealth, education, prison-survival

## 8. Data Contracts
The implementation should use JSON documents validated by schema:
- `docs/design/bitlife-core-schema.json`

Suggested usage:
- use one config for rules/content
- use one save-state per life run
- keep event/action entries data-driven, not hardcoded in UI layer

## 9. MVP Cut (Recommended)
Ship first playable version with:
1. core stats + annual age-up loop
2. 6 action groups (mind/body, relationship, school/work, crime, assets-lite, doctor)
3. 40-60 events across childhood/adult/prison/health
4. prison flow (arrest -> sentence -> escape/appeal/parole)
5. death summary + preliminary ribbon logic

## 10. Non-MVP Backlog
- politics/approval variant
- deep royalty systems
- social platform-specific mechanics
- advanced economy simulation (renting, inflation, taxes)
- multi-generation inheritance depth
