import { vi } from "vitest";
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import type { LifeState } from "../domain/types";
import { useGameStore } from "../store/gameStore";

const storageMocks = vi.hoisted(() => ({
  saveActiveLife: vi.fn(),
  saveCompletedLife: vi.fn(),
  loadActiveLife: vi.fn(),
  listCompletedLives: vi.fn(),
  clearActiveLife: vi.fn()
}));

vi.mock("../storage/indexedDb", () => storageMocks);

function lifeWith(overrides: Partial<LifeState> = {}) {
  return {
    ...generateLife({ seed: "store-fixture", catalog }),
    ...overrides
  };
}

describe("gameStore", () => {
  beforeEach(() => {
    storageMocks.saveActiveLife.mockReset();
    storageMocks.saveActiveLife.mockResolvedValue(undefined);
    storageMocks.saveCompletedLife.mockReset();
    storageMocks.saveCompletedLife.mockResolvedValue(undefined);
    storageMocks.loadActiveLife.mockReset();
    storageMocks.loadActiveLife.mockResolvedValue(undefined);
    storageMocks.listCompletedLives.mockReset();
    storageMocks.listCompletedLives.mockResolvedValue([]);
    storageMocks.clearActiveLife.mockReset();
    useGameStore.getState().resetForTest();
  });

  it("starts a new life", () => {
    useGameStore.getState().startNewLife("store-seed");

    const life = useGameStore.getState().life;
    expect(life?.seed).toBe("store-seed");
    expect(life?.age).toBe(0);
    expect(useGameStore.getState().error).toBeUndefined();
    expect(storageMocks.saveActiveLife).toHaveBeenCalledWith(life);
  });

  it("advances a life", () => {
    useGameStore.getState().startNewLife("advance-store");
    useGameStore.getState().advanceYear();

    expect(useGameStore.getState().life?.age).toBe(1);
    expect(useGameStore.getState().error).toBeUndefined();
  });

  it("sets the selected view", () => {
    useGameStore.getState().setView("activities");

    expect(useGameStore.getState().selectedView).toBe("activities");
  });

  it("does not mutate state when actions run without a life", () => {
    useGameStore.getState().setView("relationships");

    expect(() => useGameStore.getState().advanceYear()).not.toThrow();
    expect(() => useGameStore.getState().chooseEvent("rest")).not.toThrow();
    expect(() => useGameStore.getState().doActivity("rest")).not.toThrow();

    expect(useGameStore.getState().life).toBeUndefined();
    expect(useGameStore.getState().selectedView).toBe("relationships");
    expect(useGameStore.getState().error).toBeUndefined();
    expect(storageMocks.saveActiveLife).not.toHaveBeenCalled();
  });

  it("resolves a pending event choice", () => {
    const life = lifeWith({ pendingEventId: "quiet_year" });
    useGameStore.setState({ life, error: "previous error" });

    useGameStore.getState().chooseEvent("rest");

    const updated = useGameStore.getState().life;
    expect(updated?.pendingEventId).toBeUndefined();
    expect(updated?.log.at(-1)?.messageKey).toBe("log.choice_resolved");
    expect(useGameStore.getState().lastFeedback?.source).toBe("choice");
    expect(useGameStore.getState().lastFeedback?.entries.length).toBeGreaterThan(0);
    expect(useGameStore.getState().error).toBeUndefined();
    expect(storageMocks.saveActiveLife).toHaveBeenCalledWith(updated);
  });

  it("performs an available activity", () => {
    const life = lifeWith({ pendingEventId: undefined });
    useGameStore.setState({ life, error: "previous error" });

    useGameStore.getState().doActivity("rest");

    const updated = useGameStore.getState().life;
    expect(updated?.log.at(-1)?.messageKey).toBe("log.activity");
    expect(updated?.stats.happiness).toBeGreaterThanOrEqual(life.stats.happiness);
    expect(useGameStore.getState().lastFeedback?.source).toBe("activity");
    expect(useGameStore.getState().lastFeedback?.entries.length).toBeGreaterThan(0);
    expect(useGameStore.getState().error).toBeUndefined();
    expect(storageMocks.saveActiveLife).toHaveBeenCalledWith(updated);
  });

  it("sets an error instead of throwing for invalid event choices", () => {
    const life = lifeWith({ pendingEventId: "quiet_year" });
    useGameStore.setState({ life });

    expect(() => useGameStore.getState().chooseEvent("missing-choice")).not.toThrow();

    expect(useGameStore.getState().life).toBe(life);
    expect(useGameStore.getState().error).toContain("Missing choice missing-choice");
    expect(storageMocks.saveActiveLife).not.toHaveBeenCalled();
  });

  it("sets an error instead of throwing for unavailable activities", () => {
    const life = lifeWith({ age: 0, pendingEventId: undefined });
    useGameStore.setState({ life });

    expect(() => useGameStore.getState().doActivity("study")).not.toThrow();

    expect(useGameStore.getState().life).toBe(life);
    expect(useGameStore.getState().error).toContain("Activity study is not available");
    expect(storageMocks.saveActiveLife).not.toHaveBeenCalled();
  });

  it("performs activities even when an event is pending", () => {
    const life = lifeWith({ pendingEventId: "quiet_year" });
    useGameStore.setState({ life });

    expect(() => useGameStore.getState().doActivity("rest")).not.toThrow();

    expect(useGameStore.getState().life?.pendingEventId).toBe("quiet_year");
    expect(useGameStore.getState().life?.log.at(-1)?.messageKey).toBe("log.activity");
    expect(useGameStore.getState().error).toBeUndefined();
    expect(storageMocks.saveActiveLife).toHaveBeenCalled();
  });

  it("sets an error instead of throwing when an activity runs after death", () => {
    const life = lifeWith({ alive: false, pendingEventId: undefined });
    useGameStore.setState({ life });

    expect(() => useGameStore.getState().doActivity("rest")).not.toThrow();

    expect(useGameStore.getState().life).toBe(life);
    expect(useGameStore.getState().error).toContain("Cannot perform activities after death");
    expect(storageMocks.saveActiveLife).not.toHaveBeenCalled();
  });

  it("hydrates an active life from persistence", async () => {
    const life = lifeWith({ seed: "persisted-life" });
    const pastLife = lifeWith({ id: "past-life", seed: "past-life" });
    storageMocks.loadActiveLife.mockResolvedValue(life);
    storageMocks.listCompletedLives.mockResolvedValue([pastLife]);

    await useGameStore.getState().hydrateActiveLife();

    expect(storageMocks.loadActiveLife).toHaveBeenCalledOnce();
    expect(storageMocks.listCompletedLives).toHaveBeenCalledOnce();
    expect(useGameStore.getState().life).toBe(life);
    expect(useGameStore.getState().pastLives).toEqual([pastLife]);
    expect(useGameStore.getState().selectedView).toBe("life");
    expect(useGameStore.getState().error).toBeUndefined();
  });

  it("hydrates a dead life into tombstone view", async () => {
    const life = lifeWith({
      alive: false,
      death: {
        ageAtDeath: 90,
        causeOfDeath: "old_age",
        summaryKey: "death.old_age",
        tags: ["elder"],
        score: 1234,
        netWorth: 500,
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    });
    storageMocks.loadActiveLife.mockResolvedValue(life);

    await useGameStore.getState().hydrateActiveLife();

    expect(useGameStore.getState().life).toBe(life);
    expect(useGameStore.getState().selectedView).toBe("tombstone");
  });

  it("leaves state unchanged when hydration finds no active life", async () => {
    const pastLife = lifeWith({ id: "stored-tombstone", seed: "stored-tombstone" });
    useGameStore.getState().setView("career");
    storageMocks.loadActiveLife.mockResolvedValue(undefined);
    storageMocks.listCompletedLives.mockResolvedValue([pastLife]);

    await useGameStore.getState().hydrateActiveLife();

    expect(useGameStore.getState().life).toBeUndefined();
    expect(useGameStore.getState().pastLives).toEqual([pastLife]);
    expect(useGameStore.getState().selectedView).toBe("career");
    expect(useGameStore.getState().error).toBeUndefined();
  });

  it("stores completed lives locally when death occurs", () => {
    const life = lifeWith({
      age: 88,
      stats: { happiness: 20, health: 1, smarts: 40, looks: 20 },
      pendingEventId: "family_picnic"
    });
    useGameStore.setState({ life });

    useGameStore.getState().advanceYear();

    const completedLife = useGameStore.getState().life;
    expect(completedLife?.death?.causeOfDeath).toBe("low_health");
    expect(useGameStore.getState().pastLives).toEqual([completedLife]);
    expect(storageMocks.saveCompletedLife).toHaveBeenCalledWith(completedLife);
  });

  it("surfaces persistence failures", async () => {
    storageMocks.saveActiveLife.mockRejectedValueOnce(new Error("IndexedDB unavailable"));

    useGameStore.getState().startNewLife("save-error");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(useGameStore.getState().error).toBe("IndexedDB unavailable");
  });

  it("clears life, selected view, and error for tests", () => {
    useGameStore.setState({ life: lifeWith(), selectedView: "leaderboard", error: "problem" });

    useGameStore.getState().resetForTest();

    expect(useGameStore.getState().life).toBeUndefined();
    expect(useGameStore.getState().pastLives).toEqual([]);
    expect(useGameStore.getState().selectedView).toBe("life");
    expect(useGameStore.getState().error).toBeUndefined();
  });
});
