import { ensureP1State } from "../domain/p1/defaultState";
import type { LifeState } from "../domain/types";

export function migrateLifeState(life: LifeState): ReturnType<typeof ensureP1State> {
  return ensureP1State(life);
}
