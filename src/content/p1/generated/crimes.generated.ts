import type { P1Catalog } from "../schema";

export const generatedCrimes = [
  { id: "p1_crime_shoplifting", nameKey: "p1.crime.shoplifting.name", severity: 1, minReward: 20, maxReward: 250, baseSuccess: 0.7, baseArrest: 0.22, source: "generated:p1:crimes", requirements: { minAge: 13, notInPrison: true } },
  { id: "p1_crime_pickpocket", nameKey: "p1.crime.pickpocket.name", severity: 2, minReward: 50, maxReward: 700, baseSuccess: 0.58, baseArrest: 0.32, source: "generated:p1:crimes", requirements: { minAge: 14, notInPrison: true } },
  { id: "p1_crime_burglary", nameKey: "p1.crime.burglary.name", severity: 4, minReward: 400, maxReward: 6000, baseSuccess: 0.42, baseArrest: 0.45, source: "generated:p1:crimes", requirements: { minAge: 16, notInPrison: true } },
  { id: "p1_crime_car_theft", nameKey: "p1.crime.car_theft.name", severity: 5, minReward: 1200, maxReward: 12000, baseSuccess: 0.36, baseArrest: 0.52, source: "generated:p1:crimes", requirements: { minAge: 16, notInPrison: true } },
  { id: "p1_crime_bank_robbery", nameKey: "p1.crime.bank_robbery.name", severity: 8, minReward: 8000, maxReward: 90000, baseSuccess: 0.18, baseArrest: 0.72, source: "generated:p1:crimes", requirements: { minAge: 18, notInPrison: true } },
  { id: "p1_crime_fraud", nameKey: "p1.crime.fraud.name", severity: 6, minReward: 1500, maxReward: 40000, baseSuccess: 0.34, baseArrest: 0.5, source: "generated:p1:crimes", requirements: { minAge: 18, notInPrison: true } }
] satisfies P1Catalog["crimes"];
