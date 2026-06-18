import type { GameCatalog } from "./schema";

export const events = [
  { id: "family_picnic", promptKey: "event.family_picnic", domain: "family", minAge: 0, maxAge: 17, weight: 4, choices: [
    { id: "join", labelKey: "choice.join", effects: [{ stats: { happiness: 4 }, relationship: 3 }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ stats: { happiness: -1 }, relationship: -2 }] }
  ] },
  { id: "school_quiz", promptKey: "event.school_quiz", domain: "school", minAge: 6, maxAge: 22, weight: 5, choices: [
    { id: "study", labelKey: "choice.study", effects: [{ stats: { smarts: 4, happiness: -1 } }] },
    { id: "wing_it", labelKey: "choice.wing_it", effects: [{ stats: { happiness: 1, smarts: -1 } }] }
  ] },
  { id: "weird_neighbor", promptKey: "event.weird_neighbor", domain: "misc", minAge: 4, weight: 1, choices: [
    { id: "listen", labelKey: "choice.listen", effects: [{ stats: { happiness: 2, smarts: 1 } }] },
    { id: "joke", labelKey: "choice.joke", effects: [{ stats: { happiness: 3, looks: -1 } }] }
  ] },
  { id: "friend_secret", promptKey: "event.friend_secret", domain: "relationship", minAge: 10, weight: 3, choices: [
    { id: "listen", labelKey: "choice.listen", effects: [{ relationship: 5, stats: { happiness: 1 } }] },
    { id: "joke", labelKey: "choice.joke", effects: [{ relationship: -4, stats: { happiness: -1 } }] }
  ] },
  { id: "fever", promptKey: "event.fever", domain: "health", minAge: 0, weight: 3, choices: [
    { id: "doctor", labelKey: "choice.doctor", effects: [{ cash: -120, stats: { health: 4 } }] },
    { id: "sleep", labelKey: "choice.sleep", effects: [{ stats: { health: -3, happiness: -1 }, addDiseaseId: "cold" }] }
  ] },
  { id: "job_offer", promptKey: "event.job_offer", domain: "career", minAge: 18, weight: 3, choices: [
    { id: "accept", labelKey: "choice.accept", effects: [{ cash: 700, stats: { happiness: 2 } }] },
    { id: "decline", labelKey: "choice.decline", effects: [{ stats: { happiness: -1 } }] }
  ] },
  { id: "lost_wallet", promptKey: "event.lost_wallet", domain: "misc", minAge: 10, weight: 3, choices: [
    { id: "return", labelKey: "choice.return", effects: [{ stats: { happiness: 3 }, cash: 50 }] },
    { id: "keep", labelKey: "choice.keep", effects: [{ stats: { happiness: -2 }, cash: 300, addFlag: "kept_wallet" }] }
  ] },
  { id: "bad_food", promptKey: "event.bad_food", domain: "health", minAge: 6, weight: 2, choices: [
    { id: "doctor", labelKey: "choice.doctor", effects: [{ cash: -100, stats: { health: 2 } }] },
    { id: "sleep", labelKey: "choice.sleep", effects: [{ stats: { health: -5 }, addDiseaseId: "food_poisoning" }] }
  ] },
  { id: "family_argument", promptKey: "event.family_argument", domain: "family", minAge: 8, weight: 4, choices: [
    { id: "apologize", labelKey: "choice.apologize", effects: [{ relationship: 4, stats: { happiness: -1 } }] },
    { id: "argue", labelKey: "choice.argue", effects: [{ relationship: -5, stats: { happiness: -3 } }] }
  ] },
  { id: "crush_message", promptKey: "event.crush_message", domain: "relationship", minAge: 14, weight: 2, choices: [
    { id: "accept", labelKey: "choice.accept", effects: [{ relationship: 5, stats: { happiness: 4 } }] },
    { id: "decline", labelKey: "choice.decline", effects: [{ stats: { happiness: -1 } }] }
  ] },
  { id: "work_mistake", promptKey: "event.work_mistake", domain: "career", minAge: 18, weight: 3, choices: [
    { id: "apologize", labelKey: "choice.apologize", effects: [{ stats: { smarts: 1, happiness: -1 } }] },
    { id: "argue", labelKey: "choice.argue", effects: [{ stats: { happiness: -4 }, addFlag: "work_conflict" }] }
  ] },
  { id: "quiet_year", promptKey: "event.quiet_year", domain: "misc", minAge: 0, weight: 6, choices: [
    { id: "rest", labelKey: "choice.sleep", effects: [{ stats: { happiness: 1, health: 1 } }] },
    { id: "study", labelKey: "choice.study", effects: [{ stats: { smarts: 1 } }] }
  ] }
] satisfies GameCatalog["events"];
