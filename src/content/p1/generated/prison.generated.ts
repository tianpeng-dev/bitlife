import type { P1Catalog } from "../schema";

export const generatedPrisonActivities = [
  {
    id: "p1_prison_appeal",
    labelKey: "p1.prison.appeal.label",
    resultKey: "p1.prison.appeal.result",
    requirements: { minAge: 13, inPrison: true },
    effects: { prisonTime: -1, happiness: 2 }
  },
  {
    id: "p1_prison_parole",
    labelKey: "p1.prison.parole.label",
    resultKey: "p1.prison.parole.result",
    requirements: { minAge: 16, inPrison: true },
    effects: { prisonTime: -2, happiness: 3 }
  },
  {
    id: "p1_prison_work",
    labelKey: "p1.prison.work.label",
    resultKey: "p1.prison.work.result",
    requirements: { minAge: 13, inPrison: true },
    effects: { cash: 15, health: -1, happiness: -1 }
  },
  {
    id: "p1_prison_exercise",
    labelKey: "p1.prison.exercise.label",
    resultKey: "p1.prison.exercise.result",
    requirements: { minAge: 13, inPrison: true },
    effects: { health: 4, happiness: 1 }
  }
] satisfies P1Catalog["prisonActivities"];
