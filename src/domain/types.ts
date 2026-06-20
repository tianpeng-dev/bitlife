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

export type ConsequenceSource = "choice" | "activity";

export type ConsequenceOutcome =
  | "lucky_break"
  | "injury"
  | "reputation"
  | "regret"
  | "health_scare"
  | "relationship_echo"
  | "fatal_accident";

export interface PendingConsequence {
  id: string;
  source: ConsequenceSource;
  originId: string;
  choiceId?: string;
  triggerAge: number;
  outcome: ConsequenceOutcome;
  intensity: number;
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
  pendingConsequences?: PendingConsequence[];
  saveVersion?: number;
  assets?: { items: OwnedAsset[] };
  legal?: LegalState;
  prison?: PrisonState;
  fame?: FameState;
  socialAccounts?: SocialAccountState[];
  pets?: PetState[];
  migrationHistory?: MigrationRecord[];
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
