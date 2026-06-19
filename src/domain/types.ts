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
  freeActivitiesCompletedThisYear?: string[];
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
