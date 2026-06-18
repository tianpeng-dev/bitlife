import type { GameCatalog } from "./schema";

export const careers = [
  { id: "cashier", titleKey: "career.cashier", minAge: 18, salary: 24000, requiredSmarts: 10 },
  { id: "teacher", titleKey: "career.teacher", minAge: 22, salary: 42000, requiredSmarts: 55 },
  { id: "nurse", titleKey: "career.nurse", minAge: 22, salary: 52000, requiredSmarts: 60 },
  { id: "developer", titleKey: "career.developer", minAge: 20, salary: 80000, requiredSmarts: 70 },
  { id: "writer", titleKey: "career.writer", minAge: 18, salary: 36000, requiredSmarts: 50 },
  { id: "chef", titleKey: "career.chef", minAge: 18, salary: 38000, requiredSmarts: 30 },
  { id: "designer", titleKey: "career.designer", minAge: 20, salary: 56000, requiredSmarts: 45 },
  { id: "mechanic", titleKey: "career.mechanic", minAge: 18, salary: 44000, requiredSmarts: 25 },
  { id: "paramedic", titleKey: "career.paramedic", minAge: 20, salary: 48000, requiredSmarts: 45 },
  { id: "accountant", titleKey: "career.accountant", minAge: 22, salary: 61000, requiredSmarts: 60 },
  { id: "lawyer", titleKey: "career.lawyer", minAge: 25, salary: 95000, requiredSmarts: 82 },
  { id: "doctor", titleKey: "career.doctor", minAge: 26, salary: 120000, requiredSmarts: 88 },
  { id: "artist", titleKey: "career.artist", minAge: 18, salary: 33000, requiredSmarts: 35 },
  { id: "entrepreneur", titleKey: "career.entrepreneur", minAge: 21, salary: 70000, requiredSmarts: 65 },
  { id: "civil_servant", titleKey: "career.civil_servant", minAge: 22, salary: 50000, requiredSmarts: 50 }
] satisfies GameCatalog["careers"];
