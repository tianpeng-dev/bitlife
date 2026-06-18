import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { App } from "../App";
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import type { LifeState } from "../domain/types";
import { useGameStore } from "../store/gameStore";

const storageMocks = vi.hoisted(() => ({
  saveActiveLife: vi.fn(),
  loadActiveLife: vi.fn(),
  clearActiveLife: vi.fn()
}));

vi.mock("../storage/indexedDb", () => storageMocks);

function lifeWith(overrides: Partial<LifeState> = {}) {
  return {
    ...generateLife({ seed: "app-smoke-fixture", catalog }),
    ...overrides
  };
}

describe("App", () => {
  beforeEach(() => {
    storageMocks.saveActiveLife.mockReset();
    storageMocks.saveActiveLife.mockResolvedValue(undefined);
    storageMocks.loadActiveLife.mockReset();
    storageMocks.loadActiveLife.mockResolvedValue(undefined);
    storageMocks.clearActiveLife.mockReset();
    useGameStore.getState().resetForTest();
  });

  it("starts a new life and advances one year", async () => {
    render(<App />);
    await waitFor(() => expect(storageMocks.loadActiveLife).toHaveBeenCalledOnce());

    await userEvent.click(screen.getByRole("button", { name: "开始新人生" }));
    expect(screen.getByText(/年龄：0/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "年龄\+1" }));
    expect(screen.getByText(/年龄：1/)).toBeInTheDocument();
  });

  it("hydrates on mount and lets dead lives navigate to read-only tabs", async () => {
    const deadLife = lifeWith({
      age: 82,
      stage: "elder",
      alive: false,
      death: {
        ageAtDeath: 82,
        causeOfDeath: "old_age",
        summaryKey: "death.summary",
        tags: ["ordinary"],
        score: 123,
        netWorth: 456,
        createdAt: "2026-06-18T00:00:00.000Z"
      },
      pendingEventId: undefined
    });
    storageMocks.loadActiveLife.mockResolvedValue(deadLife);

    render(<App />);

    expect(await screen.findByText("R.I.P.")).toBeInTheDocument();
    expect(screen.getByText("自然老去")).toBeInTheDocument();
    expect(screen.getByText("普通一生")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "关系" }));
    expect(screen.getByRole("heading", { name: "关系" })).toBeInTheDocument();
    expect(screen.queryByText("R.I.P.")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "墓碑" }));
    expect(screen.getByText("R.I.P.")).toBeInTheDocument();
  });
});
