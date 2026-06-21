import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";
import type { LifeState } from "../domain/types";
import { ActivitiesView } from "../views/ActivitiesView";

function lifeWith(overrides: Partial<LifeState> = {}): LifeState {
  return {
    ...generateLife({ seed: "p1-activity-ui", catalog }),
    age: 25,
    pendingEventId: undefined,
    ...overrides
  };
}

describe("P1 activity UI", () => {
  it("shows P1 activity groups alongside existing P0 groups for an adult life", () => {
    render(<ActivitiesView life={lifeWith()} locale="zh-CN" onActivity={vi.fn()} />);

    expect(screen.getAllByText("资产").length).toBeGreaterThan(0);
    expect(screen.getAllByText("犯罪").length).toBeGreaterThan(0);
    expect(screen.getAllByText("宠物").length).toBeGreaterThan(0);
    expect(screen.getAllByText("身心").length).toBeGreaterThan(0);
  });

  it("dispatches the compact apartment activity id when clicked", async () => {
    const onActivity = vi.fn();

    render(<ActivitiesView life={lifeWith({ cash: 100_000 })} locale="zh-CN" onActivity={onActivity} />);

    await userEvent.click(screen.getByRole("button", { name: /紧凑公寓/ }));

    expect(onActivity).toHaveBeenCalledWith("p1_asset_buy_compact_apartment");
  });

  it("switches to prison activities and disables ordinary activities while imprisoned", () => {
    const life = ensureP1State({
      ...lifeWith(),
      prison: {
        inPrison: true,
        sentenceYears: 3,
        remainingYears: 2,
        securityLevel: "minimum",
        behavior: 50,
        respect: 20
      }
    });

    render(<ActivitiesView life={life} locale="zh-CN" onActivity={vi.fn()} />);

    expect(screen.getByRole("button", { name: /去锻炼/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /提交上诉/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /紧凑公寓/ })).not.toBeInTheDocument();
  });
});
