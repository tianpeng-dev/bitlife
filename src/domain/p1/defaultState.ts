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
