import { create } from "zustand";
import { catalog } from "../content/catalog";
import { advanceYear as engineAdvanceYear, performActivity, resolveEventChoice } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import type { LifeState } from "../domain/types";
import { listCompletedLives, loadActiveLife, saveActiveLife, saveCompletedLife } from "../storage/indexedDb";

export type SelectedView = "life" | "activities" | "relationships" | "career" | "tombstone" | "leaderboard";

export interface GameStore {
  life?: LifeState;
  pastLives: LifeState[];
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

function persist(life: LifeState | undefined, setError: (message: string) => void) {
  if (life) {
    void saveActiveLife(life).catch((error) => setError(errorMessage(error)));
  }
  if (life?.death) {
    void saveCompletedLife(life).catch((error) => setError(errorMessage(error)));
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export const useGameStore = create<GameStore>((set, get) => ({
  pastLives: [],
  selectedView: "life",
  async hydrateActiveLife() {
    try {
      const [life, pastLives] = await Promise.all([loadActiveLife(), listCompletedLives()]);
      if (!life) {
        set({ pastLives, error: undefined });
        return;
      }
      set({ life, pastLives, selectedView: life.death ? "tombstone" : "life", error: undefined });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },
  startNewLife(seed) {
    const life = generateLife({ seed, catalog });
    persist(life, (error) => set({ error }));
    set({ life, selectedView: "life", error: undefined });
  },
  advanceYear() {
    const current = get().life;
    if (!current) return;
    const result = engineAdvanceYear({ life: current, catalog });
    persist(result.life, (error) => set({ error }));
    set((state) => ({
      life: result.life,
      pastLives: result.life.death ? [...state.pastLives.filter((item) => item.id !== result.life.id), result.life] : state.pastLives,
      selectedView: result.life.death ? "tombstone" : "life",
      error: undefined
    }));
  },
  chooseEvent(choiceId) {
    const current = get().life;
    if (!current) return;
    try {
      const result = resolveEventChoice({ life: current, catalog, choiceId });
      persist(result.life, (error) => set({ error }));
      set((state) => ({
        life: result.life,
        pastLives: result.life.death ? [...state.pastLives.filter((item) => item.id !== result.life.id), result.life] : state.pastLives,
        selectedView: result.life.death ? "tombstone" : state.selectedView,
        error: undefined
      }));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },
  doActivity(activityId) {
    const current = get().life;
    if (!current) return;
    try {
      const result = performActivity({ life: current, catalog, activityId });
      persist(result.life, (error) => set({ error }));
      set((state) => ({
        life: result.life,
        pastLives: result.life.death ? [...state.pastLives.filter((item) => item.id !== result.life.id), result.life] : state.pastLives,
        selectedView: result.life.death ? "tombstone" : state.selectedView,
        error: undefined
      }));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },
  setView(view) {
    set({ selectedView: view });
  },
  resetForTest() {
    set({ life: undefined, pastLives: [], selectedView: "life", error: undefined });
  }
}));
