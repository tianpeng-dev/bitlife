import type { GameCatalog } from "../../content/schema";
import type { LifeLogEntry, LifeState } from "../types";
import { tickAssets } from "./assets";
import { ensureP1State } from "./defaultState";
import { tickFameSocial } from "./fameSocial";
import { tickPets } from "./pets";
import { tickPrison } from "./prison";
import { tickRomanceFamily } from "./romanceFamily";

type P1Tick = (input: { life: LifeState; catalog: GameCatalog }) => { life: LifeState; logs: LifeLogEntry[] };

const p1YearlyTicks: P1Tick[] = [tickRomanceFamily, tickAssets, tickPets, tickPrison, tickFameSocial];

export function tickP1Year({ life, catalog }: { life: LifeState; catalog: GameCatalog }) {
  let next: LifeState = ensureP1State(life);
  const logs: LifeLogEntry[] = [];

  for (const tick of p1YearlyTicks) {
    const result = tick({ life: next, catalog });
    next = result.life;
    logs.push(...result.logs);
  }

  return { life: next, logs };
}
