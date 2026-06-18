import type { GameCatalog } from "./schema";

export const diseases = [
  { id: "cold", nameKey: "disease.cold", severity: 12, healthDrain: 3, treatability: 0.9 },
  { id: "anxiety", nameKey: "disease.anxiety", severity: 20, healthDrain: 1, treatability: 0.6 },
  { id: "food_poisoning", nameKey: "disease.food_poisoning", severity: 28, healthDrain: 6, treatability: 0.8 },
  { id: "pneumonia", nameKey: "disease.pneumonia", severity: 60, healthDrain: 10, treatability: 0.5 },
  { id: "sprained_ankle", nameKey: "disease.sprained_ankle", severity: 18, healthDrain: 2, treatability: 0.95 },
  { id: "migraine", nameKey: "disease.migraine", severity: 25, healthDrain: 3, treatability: 0.7 },
  { id: "allergy", nameKey: "disease.allergy", severity: 15, healthDrain: 2, treatability: 0.85 },
  { id: "insomnia", nameKey: "disease.insomnia", severity: 22, healthDrain: 2, treatability: 0.65 },
  { id: "burnout", nameKey: "disease.burnout", severity: 35, healthDrain: 4, treatability: 0.55 },
  { id: "back_pain", nameKey: "disease.back_pain", severity: 24, healthDrain: 3, treatability: 0.7 },
  { id: "flu", nameKey: "disease.flu", severity: 34, healthDrain: 7, treatability: 0.75 },
  { id: "high_blood_pressure", nameKey: "disease.high_blood_pressure", severity: 45, healthDrain: 5, treatability: 0.55 }
] satisfies GameCatalog["diseases"];
