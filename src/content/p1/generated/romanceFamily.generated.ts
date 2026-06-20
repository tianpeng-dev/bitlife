import type { P1Catalog } from "../schema";

export const generatedRomanceActivities = [
  {
    id: "p1_romance_date",
    labelKey: "p1.romance.date.label",
    resultKey: "p1.romance.date.result",
    requirements: { minAge: 13, notInPrison: true },
    effects: { happiness: 4, relationship: 3 }
  },
  {
    id: "p1_romance_propose",
    labelKey: "p1.romance.propose.label",
    resultKey: "p1.romance.propose.result",
    requirements: { minAge: 18, minCash: 300, notInPrison: true },
    effects: { cash: -300, happiness: 8, relationship: 8 }
  },
  {
    id: "p1_family_try_child",
    labelKey: "p1.family.try_child.label",
    resultKey: "p1.family.try_child.result",
    requirements: { minAge: 18, notInPrison: true },
    effects: { happiness: 3, fertility: 0.35 }
  },
  {
    id: "p1_family_adopt",
    labelKey: "p1.family.adopt.label",
    resultKey: "p1.family.adopt.result",
    requirements: { minAge: 21, minCash: 5000, notInPrison: true },
    effects: { cash: -5000, happiness: 7, relationship: 5 }
  },
  {
    id: "p1_romance_divorce",
    labelKey: "p1.romance.divorce.label",
    resultKey: "p1.romance.divorce.result",
    requirements: { minAge: 18, notInPrison: true },
    effects: { cash: -1200, happiness: -8, relationship: -20 }
  },
  {
    id: "p1_family_child_time",
    labelKey: "p1.family.child_time.label",
    resultKey: "p1.family.child_time.result",
    requirements: { minAge: 18, notInPrison: true },
    effects: { happiness: 5, relationship: 6 }
  }
] satisfies P1Catalog["romanceActivities"];
