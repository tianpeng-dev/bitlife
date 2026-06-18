import type { GameCatalog } from "./schema";

export const activities = [
  { id: "study", labelKey: "activity.study", group: "education_career", minAge: 6, effects: [{ stats: { smarts: 4, happiness: -1 }, logKey: "activity.study" }] },
  { id: "exercise", labelKey: "activity.exercise", group: "mind_body", minAge: 8, effects: [{ stats: { health: 4, looks: 1 }, logKey: "activity.exercise" }] },
  { id: "doctor", labelKey: "activity.doctor", group: "health", minAge: 0, cost: 150, effects: [{ stats: { health: 6 }, cash: -150, logKey: "activity.doctor" }] },
  { id: "friend", labelKey: "activity.friend", group: "relationships", minAge: 6, effects: [{ stats: { happiness: 2 }, relationship: 4, logKey: "activity.friend" }] },
  { id: "date", labelKey: "activity.date", group: "relationships", minAge: 16, effects: [{ stats: { happiness: 3 }, relationship: 3, logKey: "activity.date" }] },
  { id: "part_time", labelKey: "activity.part_time", group: "education_career", minAge: 16, effects: [{ stats: { happiness: -1 }, cash: 400, logKey: "activity.part_time" }] },
  { id: "community_gig", labelKey: "activity.community_gig", group: "education_career", minAge: 18, effects: [{ stats: { happiness: -2, smarts: 1 }, cash: 600, logKey: "activity.community_gig" }] },
  { id: "rest", labelKey: "activity.rest", group: "leisure", minAge: 0, effects: [{ stats: { happiness: 2, health: 2 }, logKey: "activity.rest" }] },
  { id: "read_book", labelKey: "activity.read_book", group: "mind_body", minAge: 6, cost: 20, effects: [{ stats: { smarts: 3, happiness: 1 }, cash: -20, logKey: "activity.read_book" }] },
  { id: "meditate", labelKey: "activity.meditate", group: "mind_body", minAge: 12, effects: [{ stats: { happiness: 3, health: 1 }, logKey: "activity.meditate" }] },
  { id: "volunteer", labelKey: "activity.volunteer", group: "relationships", minAge: 14, effects: [{ stats: { happiness: 2 }, relationship: 2, logKey: "activity.volunteer" }] },
  { id: "family_call", labelKey: "activity.family_call", group: "relationships", minAge: 10, effects: [{ relationship: 3, stats: { happiness: 1 }, logKey: "activity.family_call" }] },
  { id: "club_meeting", labelKey: "activity.club_meeting", group: "education_career", minAge: 10, maxAge: 22, cost: 30, effects: [{ stats: { smarts: 2, happiness: 2 }, cash: -30, logKey: "activity.club_meeting" }] },
  { id: "internship", labelKey: "activity.internship", group: "education_career", minAge: 18, effects: [{ stats: { smarts: 2, happiness: -1 }, cash: 300, logKey: "activity.internship" }] },
  { id: "therapy", labelKey: "activity.therapy", group: "health", minAge: 12, cost: 200, effects: [{ stats: { happiness: 5, health: 1 }, cash: -200, logKey: "activity.therapy" }] },
  { id: "vaccination", labelKey: "activity.vaccination", group: "health", minAge: 0, cost: 80, effects: [{ stats: { health: 5, happiness: -1 }, cash: -80, logKey: "activity.vaccination" }] },
  { id: "cook_meal", labelKey: "activity.cook_meal", group: "health", minAge: 12, cost: 35, effects: [{ stats: { health: 2, happiness: 1 }, cash: -35, logKey: "activity.cook_meal" }] },
  { id: "watch_movie", labelKey: "activity.watch_movie", group: "leisure", minAge: 6, cost: 25, effects: [{ stats: { happiness: 3 }, cash: -25, logKey: "activity.watch_movie" }] },
  { id: "travel_local", labelKey: "activity.travel_local", group: "leisure", minAge: 16, cost: 250, effects: [{ stats: { happiness: 4, smarts: 1 }, cash: -250, logKey: "activity.travel_local" }] },
  { id: "play_music", labelKey: "activity.play_music", group: "leisure", minAge: 8, cost: 60, effects: [{ stats: { happiness: 3, looks: 1 }, cash: -60, logKey: "activity.play_music" }] },
  { id: "social_media", labelKey: "activity.social_media", group: "leisure", minAge: 13, effects: [{ stats: { happiness: 1, smarts: -1 }, relationship: 1, logKey: "activity.social_media" }] },
  { id: "night_out", labelKey: "activity.night_out", group: "risk", minAge: 18, cost: 120, effects: [{ stats: { happiness: 4, health: -2 }, cash: -120, logKey: "activity.night_out" }] },
  { id: "gamble_small", labelKey: "activity.gamble_small", group: "risk", minAge: 18, cost: 100, effects: [{ stats: { happiness: 1 }, cash: -100, addFlag: "gambled_small", logKey: "activity.gamble_small" }] },
  { id: "skip_school", labelKey: "activity.skip_school", group: "risk", minAge: 10, maxAge: 18, effects: [{ stats: { happiness: 2, smarts: -3 }, addFlag: "skipped_school", logKey: "activity.skip_school" }] },
  { id: "pitch_idea", labelKey: "activity.pitch_idea", group: "education_career", minAge: 18, effects: [{ stats: { happiness: 1 }, cash: 250, logKey: "activity.pitch_idea" }] }
] satisfies GameCatalog["activities"];
