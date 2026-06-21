import { render, screen } from "@testing-library/react";
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { buyAsset } from "../domain/p1/assets";
import { ensureP1State } from "../domain/p1/defaultState";
import { adoptPet } from "../domain/p1/pets";
import type { LifeState } from "../domain/types";
import { LifeView } from "../views/LifeView";
import { RelationshipsView } from "../views/RelationshipsView";

function lifeWith(overrides: Partial<LifeState> = {}): LifeState {
  return {
    ...generateLife({ seed: "p1-status-views", catalog }),
    age: 25,
    pendingEventId: undefined,
    ...overrides
  };
}

describe("P1 status views", () => {
  it("shows net worth and asset summaries in LifeView", () => {
    const life = buyAsset({
      life: ensureP1State(lifeWith({ cash: 200_000 })),
      catalog,
      assetId: "compact_apartment"
    }).life;

    render(<LifeView life={life} locale="zh-CN" onStart={() => undefined} />);

    expect(screen.getByText(/净资产/)).toBeInTheDocument();
    expect(screen.getByText("资产")).toBeInTheDocument();
  });

  it("shows adopted pets in RelationshipsView", () => {
    const life = adoptPet({
      life: ensureP1State(lifeWith({ cash: 5_000 })),
      catalog,
      petId: "p1_pet_cat"
    }).life;

    render(<RelationshipsView life={life} locale="zh-CN" />);

    expect(screen.getByText("宠物")).toBeInTheDocument();
    expect(screen.getByText("Mimi")).toBeInTheDocument();
  });
});
