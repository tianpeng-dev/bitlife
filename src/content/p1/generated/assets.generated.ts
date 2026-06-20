import type { P1Catalog } from "../schema";

export const generatedAssets = [
  {
    id: "compact_apartment",
    nameKey: "p1.asset.compact_apartment.name",
    type: "home",
    minPrice: 55000,
    maxPrice: 140000,
    conditionMin: 45,
    conditionMax: 95,
    source: "generated:p1:assets",
    requirements: { minAge: 18, minCash: 5000 }
  },
  {
    id: "used_hatchback",
    nameKey: "p1.asset.used_hatchback.name",
    type: "vehicle",
    minPrice: 2500,
    maxPrice: 12000,
    conditionMin: 35,
    conditionMax: 85,
    source: "generated:p1:assets",
    requirements: { minAge: 16, minCash: 1000 }
  },
  {
    id: "gold_ring",
    nameKey: "p1.asset.gold_ring.name",
    type: "jewelry",
    minPrice: 450,
    maxPrice: 4500,
    conditionMin: 65,
    conditionMax: 100,
    source: "generated:p1:assets",
    requirements: { minCash: 300 }
  },
  {
    id: "practice_guitar",
    nameKey: "p1.asset.practice_guitar.name",
    type: "instrument",
    minPrice: 120,
    maxPrice: 900,
    conditionMin: 40,
    conditionMax: 100,
    source: "generated:p1:assets",
    requirements: { minAge: 8, minCash: 80 }
  },
  {
    id: "fishing_boat",
    nameKey: "p1.asset.fishing_boat.name",
    type: "boat",
    minPrice: 7000,
    maxPrice: 55000,
    conditionMin: 30,
    conditionMax: 90,
    source: "generated:p1:assets",
    requirements: { minAge: 18, minCash: 2500 }
  },
  {
    id: "small_aircraft",
    nameKey: "p1.asset.small_aircraft.name",
    type: "plane",
    minPrice: 85000,
    maxPrice: 450000,
    conditionMin: 55,
    conditionMax: 100,
    source: "generated:p1:assets",
    requirements: { minAge: 21, minCash: 30000 }
  }
] satisfies P1Catalog["assets"];
