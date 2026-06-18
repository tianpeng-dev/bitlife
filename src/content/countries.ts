import type { GameCatalog } from "./schema";

export const countries = [
  { id: "us", nameKey: "country.us", cities: ["New York", "Austin"], schoolStartAge: 6, adultAge: 18, healthcareCostMultiplier: 1.4 },
  { id: "cn", nameKey: "country.cn", cities: ["Shanghai", "Chengdu"], schoolStartAge: 6, adultAge: 18, healthcareCostMultiplier: 0.8 },
  { id: "uk", nameKey: "country.uk", cities: ["London", "Manchester"], schoolStartAge: 5, adultAge: 18, healthcareCostMultiplier: 0.6 },
  { id: "jp", nameKey: "country.jp", cities: ["Tokyo", "Osaka"], schoolStartAge: 6, adultAge: 18, healthcareCostMultiplier: 0.9 },
  { id: "br", nameKey: "country.br", cities: ["Sao Paulo", "Rio"], schoolStartAge: 6, adultAge: 18, healthcareCostMultiplier: 0.7 }
] satisfies GameCatalog["countries"];
