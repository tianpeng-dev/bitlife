import type { GameCatalog } from "./schema";

export const diseases = [
  { id: "cold", nameKey: "disease.cold", severity: 12, healthDrain: 3, treatability: 0.9 },
  { id: "anxiety", nameKey: "disease.anxiety", severity: 20, healthDrain: 1, treatability: 0.6 },
  { id: "food_poisoning", nameKey: "disease.food_poisoning", severity: 28, healthDrain: 6, treatability: 0.8 },
  { id: "pneumonia", nameKey: "disease.pneumonia", severity: 60, healthDrain: 10, treatability: 0.5 }
] satisfies GameCatalog["diseases"];
