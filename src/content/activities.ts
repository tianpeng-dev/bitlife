import type { GameCatalog } from "./schema";

export const activities = [
  { id: "study", labelKey: "activity.study", group: "education_career", minAge: 6, effects: [{ stats: { smarts: 4, happiness: -1 }, logKey: "activity.study" }] },
  { id: "exercise", labelKey: "activity.exercise", group: "mind_body", minAge: 8, effects: [{ stats: { health: 4, looks: 1 }, logKey: "activity.exercise" }] },
  { id: "doctor", labelKey: "activity.doctor", group: "health", minAge: 0, cost: 150, effects: [{ stats: { health: 6 }, cash: -150, logKey: "activity.doctor" }] },
  { id: "friend", labelKey: "activity.friend", group: "relationships", minAge: 6, effects: [{ stats: { happiness: 2 }, relationship: 4, logKey: "activity.friend" }] },
  { id: "date", labelKey: "activity.date", group: "relationships", minAge: 16, effects: [{ stats: { happiness: 3 }, relationship: 3, logKey: "activity.date" }] },
  { id: "part_time", labelKey: "activity.part_time", group: "education_career", minAge: 16, effects: [{ stats: { happiness: -1 }, cash: 400, logKey: "activity.part_time" }] },
  { id: "work_hard", labelKey: "activity.work_hard", group: "education_career", minAge: 18, effects: [{ stats: { happiness: -2, smarts: 1 }, cash: 600, logKey: "activity.work_hard" }] },
  { id: "rest", labelKey: "activity.rest", group: "leisure", minAge: 0, effects: [{ stats: { happiness: 2, health: 2 }, logKey: "activity.rest" }] }
] satisfies GameCatalog["activities"];
