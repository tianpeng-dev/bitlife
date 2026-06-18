import { create } from "zustand";
import { catalog } from "../content/catalog";
import { advanceYear as engineAdvanceYear, performActivity, resolveEventChoice } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import type { LifeState } from "../domain/types";
import { loadActiveLife, saveActiveLife } from "../storage/indexedDb";

export type SelectedView = "life" | "activities" | "relationships" | "career" | "tombstone" | "leaderboard";

export interface GameStore {
  life?: LifeState;
  selectedView: SelectedView;
  error?: string;
  hydrateActiveLife(): Promise<void>;
  startNewLife(seed: string): void;
  advanceYear(): void;
  chooseEvent(choiceId: string): void;
  doActivity(activityId: string): void;
  setView(view: SelectedView): void;
  resetForTest(): void;
}

function persist(life?: LifeState) {
  if (life) {
    void saveActiveLife(life).catch(() => undefined);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export const useGameStore = create<GameStore>((set, get) => ({
  selectedView: "life",
  async hydrateActiveLife() {
    try {
      const life = await loadActiveLife();
      if (!life) {
        set({ error: undefined });
        return;
      }
      set({ life, selectedView: life.death ? "tombstone" : "life", error: undefined });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },
  startNewLife(seed) {
    const life = generateLife({ seed, catalog });
    persist(life);
    set({ life, selectedView: "life", error: undefined });
  },
  advanceYear() {
    const current = get().life;
    if (!current) return;
    const result = engineAdvanceYear({ life: current, catalog });
    persist(result.life);
    set({ life: result.life, selectedView: result.life.death ? "tombstone" : "life", error: undefined });
  },
  chooseEvent(choiceId) {
    const current = get().life;
    if (!current) return;
    try {
      const result = resolveEventChoice({ life: current, catalog, choiceId });
      persist(result.life);
      set({ life: result.life, error: undefined });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },
  doActivity(activityId) {
    const current = get().life;
    if (!current) return;
    try {
      const result = performActivity({ life: current, catalog, activityId });
      persist(result.life);
      set({ life: result.life, error: undefined });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },
  setView(view) {
    set({ selectedView: view });
  },
  resetForTest() {
    set({ life: undefined, selectedView: "life", error: undefined });
  }
}));
