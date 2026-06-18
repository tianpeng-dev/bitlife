import type { GameCatalog } from "./schema";

export const achievements = [
  { id: "long_life", labelKey: "achievement.long_life", priority: 90 },
  { id: "bright", labelKey: "achievement.bright", priority: 50 },
  { id: "beloved", labelKey: "achievement.beloved", priority: 60 },
  { id: "wealthy", labelKey: "achievement.wealthy", priority: 70 },
  { id: "unlucky", labelKey: "achievement.unlucky", priority: 80 },
  { id: "ordinary", labelKey: "achievement.ordinary", priority: 1 },
  { id: "healthy", labelKey: "achievement.healthy", priority: 55 },
  { id: "social_star", labelKey: "achievement.social_star", priority: 58 },
  { id: "career_climber", labelKey: "achievement.career_climber", priority: 68 },
  { id: "scholar", labelKey: "achievement.scholar", priority: 62 },
  { id: "romantic", labelKey: "achievement.romantic", priority: 40 },
  { id: "family_anchor", labelKey: "achievement.family_anchor", priority: 52 },
  { id: "risk_taker", labelKey: "achievement.risk_taker", priority: 45 },
  { id: "worldly", labelKey: "achievement.worldly", priority: 48 },
  { id: "comeback", labelKey: "achievement.comeback", priority: 72 },
  { id: "early_bird", labelKey: "achievement.early_bird", priority: 25 },
  { id: "late_bloomer", labelKey: "achievement.late_bloomer", priority: 30 },
  { id: "kind_heart", labelKey: "achievement.kind_heart", priority: 44 },
  { id: "hard_worker", labelKey: "achievement.hard_worker", priority: 57 },
  { id: "quiet_legend", labelKey: "achievement.quiet_legend", priority: 35 }
] satisfies GameCatalog["achievements"];
