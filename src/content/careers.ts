import type { GameCatalog } from "./schema";

export const careers = [
  { id: "cashier", titleKey: "career.cashier", minAge: 18, salary: 24000, requiredSmarts: 10 },
  { id: "teacher", titleKey: "career.teacher", minAge: 22, salary: 42000, requiredSmarts: 55 },
  { id: "nurse", titleKey: "career.nurse", minAge: 22, salary: 52000, requiredSmarts: 60 },
  { id: "developer", titleKey: "career.developer", minAge: 20, salary: 80000, requiredSmarts: 70 },
  { id: "writer", titleKey: "career.writer", minAge: 18, salary: 36000, requiredSmarts: 50 },
  { id: "chef", titleKey: "career.chef", minAge: 18, salary: 38000, requiredSmarts: 30 }
] satisfies GameCatalog["careers"];
