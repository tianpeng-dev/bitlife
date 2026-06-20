import type { P1Catalog } from "../schema";

export const generatedTravelActivities = [
  {
    id: "p1_travel_vacation",
    labelKey: "p1.travel.vacation.label",
    resultKey: "p1.travel.vacation.result",
    requirements: { minAge: 18, minCash: 800, notInPrison: true },
    effects: { cash: -800, happiness: 8, health: 1 }
  },
  {
    id: "p1_travel_honeymoon",
    labelKey: "p1.travel.honeymoon.label",
    resultKey: "p1.travel.honeymoon.result",
    requirements: { minAge: 18, minCash: 1500, notInPrison: true },
    effects: { cash: -1500, happiness: 10, relationship: 5 }
  },
  {
    id: "p1_migration_legal",
    labelKey: "p1.migration.legal.label",
    resultKey: "p1.migration.legal.result",
    requirements: { minAge: 18, minCash: 2500, notInPrison: true },
    effects: { cash: -2500, immigrationChance: 0.7, happiness: 2 }
  },
  {
    id: "p1_migration_illegal",
    labelKey: "p1.migration.illegal.label",
    resultKey: "p1.migration.illegal.result",
    requirements: { minAge: 18, minCash: 900, notInPrison: true },
    effects: { cash: -900, immigrationChance: 0.35, arrestRisk: 0.45 }
  }
] satisfies P1Catalog["travelActivities"];
