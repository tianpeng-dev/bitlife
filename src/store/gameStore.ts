import { create } from "zustand";
import { catalog } from "../content/catalog";
import { advanceYear as engineAdvanceYear, performActivity, resolveEventChoice } from "../domain/engine";
import { generateLife } from "../domain/lifeGenerator";
import type { LifeState, StatKey } from "../domain/types";
import { listCompletedLives, loadActiveLife, saveActiveLife, saveCompletedLife } from "../storage/indexedDb";

export type SelectedView = "life" | "activities" | "relationships" | "career" | "tombstone" | "leaderboard";
export type FeedbackEntry =
  | { type: "stat"; stat: StatKey; delta: number }
  | { type: "cash"; delta: number }
  | { type: "relationship"; delta: number }
  | { type: "disease"; diseaseId: string }
  | { type: "death"; causeOfDeath: string };

export interface ActionFeedback {
  source: "choice" | "activity";
  entries: FeedbackEntry[];
}

export interface GameStore {
  life?: LifeState;
  pastLives: LifeState[];
  selectedView: SelectedView;
  lastFeedback?: ActionFeedback;
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

function averageRelationship(life: LifeState): number {
  const total = life.relationships.reduce((sum, person) => sum + person.relationship, 0);
  return Math.round(total / Math.max(1, life.relationships.length));
}

function buildFeedback(before: LifeState, after: LifeState, source: ActionFeedback["source"]): ActionFeedback {
  const entries: FeedbackEntry[] = [];

  for (const key of Object.keys(before.stats) as StatKey[]) {
    const delta = after.stats[key] - before.stats[key];
    if (delta !== 0) {
      entries.push({ type: "stat", stat: key, delta });
    }
  }

  const cashDelta = after.cash - before.cash;
  if (cashDelta !== 0) {
    entries.push({ type: "cash", delta: cashDelta });
  }

  const relationshipDelta = averageRelationship(after) - averageRelationship(before);
  if (relationshipDelta !== 0) {
    entries.push({ type: "relationship", delta: relationshipDelta });
  }

  const beforeDiseaseIds = new Set(before.diseases.map((disease) => disease.id));
  for (const disease of after.diseases) {
    if (!beforeDiseaseIds.has(disease.id)) {
      entries.push({ type: "disease", diseaseId: disease.id });
    }
  }

  if (!after.alive && after.death && before.alive) {
    entries.push({ type: "death", causeOfDeath: after.death.causeOfDeath });
  }

  return { source, entries };
}

export const useGameStore = create<GameStore>((set, get) => ({
  pastLives: [],
  selectedView: "life",
  async hydrateActiveLife() {
    try {
      const [life, pastLives] = await Promise.all([loadActiveLife(), listCompletedLives()]);
      if (!life) {
        set({ pastLives, lastFeedback: undefined, error: undefined });
        return;
      }
      set({ life, pastLives, selectedView: life.death ? "tombstone" : "life", lastFeedback: undefined, error: undefined });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },
  startNewLife(seed) {
    const life = generateLife({ seed, catalog });
    persist(life, (error) => set({ error }));
    set({ life, selectedView: "life", lastFeedback: undefined, error: undefined });
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
      lastFeedback: undefined,
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
        lastFeedback: buildFeedback(current, result.life, "choice"),
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
        lastFeedback: buildFeedback(current, result.life, "activity"),
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
    set({ life: undefined, pastLives: [], selectedView: "life", lastFeedback: undefined, error: undefined });
  }
}));
