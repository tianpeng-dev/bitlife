import { render, screen } from "@testing-library/react";
import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { buyAsset } from "../domain/p1/assets";
import { ensureP1State } from "../domain/p1/defaultState";
import { adoptPet } from "../domain/p1/pets";
import type { LifeState } from "../domain/types";
import { CareerView } from "../views/CareerView";
import { LifeView } from "../views/LifeView";
import { RelationshipsView } from "../views/RelationshipsView";
import { TombstoneView } from "../views/TombstoneView";

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

  it("shows fame and social summaries even at zero values", () => {
    const life = ensureP1State(lifeWith());

    render(<CareerView life={life} locale="zh-CN" />);

    expect(screen.getByText("名声")).toBeInTheDocument();
    expect(screen.getByText(/公众好感/)).toBeInTheDocument();
    expect(screen.getByText("社交账号")).toBeInTheDocument();
  });

  it("counts living pets in TombstoneView public summary", () => {
    const life = ensureP1State({
      ...lifeWith({ alive: false }),
      pets: [
        {
          id: "pet-living",
          catalogId: "p1_pet_cat",
          name: "Mimi",
          age: 3,
          health: 80,
          relationship: 70,
          alive: true
        },
        {
          id: "pet-dead",
          catalogId: "p1_pet_cat",
          name: "Mimi",
          age: 18,
          health: 0,
          relationship: 80,
          alive: false
        }
      ],
      death: {
        ageAtDeath: 90,
        causeOfDeath: "old_age",
        summaryKey: "death.summary",
        tags: ["long_life"],
        score: 1000,
        netWorth: 5000,
        createdAt: new Date(0).toISOString()
      }
    });

    render(<TombstoneView life={life} locale="zh-CN" onStart={() => undefined} />);

    expect(screen.getByText("宠物").closest("div")).toHaveTextContent("1");
  });
});
