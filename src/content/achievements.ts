import type { GameCatalog } from "./schema";

export const achievements = [
  { id: "long_life", labelKey: "achievement.long_life", priority: 90 },
  { id: "bright", labelKey: "achievement.bright", priority: 50 },
  { id: "beloved", labelKey: "achievement.beloved", priority: 60 },
  { id: "wealthy", labelKey: "achievement.wealthy", priority: 70 },
  { id: "unlucky", labelKey: "achievement.unlucky", priority: 80 },
  { id: "ordinary", labelKey: "achievement.ordinary", priority: 1 }
] satisfies GameCatalog["achievements"];
