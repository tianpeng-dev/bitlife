import type { GameCatalog } from "./schema";

export const events = [
  { id: "family_picnic", promptKey: "event.family_picnic", domain: "family", minAge: 0, maxAge: 17, weight: 4, choices: [
    { id: "join", labelKey: "choice.join", effects: [{ stats: { happiness: 4 }, relationship: 3 }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ stats: { happiness: -1 }, relationship: -2 }] }
  ] },
  { id: "family_argument", promptKey: "event.family_argument", domain: "family", minAge: 8, weight: 4, choices: [
    { id: "apologize", labelKey: "choice.apologize", effects: [{ relationship: 4, stats: { happiness: -1 } }] },
    { id: "argue", labelKey: "choice.argue", effects: [{ relationship: -5, stats: { happiness: -3 } }] }
  ] },
  { id: "sibling_favor", promptKey: "event.sibling_favor", domain: "family", minAge: 5, maxAge: 22, weight: 3, choices: [
    { id: "help", labelKey: "choice.help", effects: [{ relationship: 3, stats: { happiness: 1 } }] },
    { id: "ignore", labelKey: "choice.ignore", effects: [{ relationship: -2, stats: { happiness: -1 } }] }
  ] },
  { id: "parent_birthday", promptKey: "event.parent_birthday", domain: "family", minAge: 6, weight: 3, choices: [
    { id: "gift", labelKey: "choice.gift", effects: [{ cash: -60, relationship: 4, stats: { happiness: 2 } }] },
    { id: "call", labelKey: "choice.call", effects: [{ relationship: 2, stats: { happiness: 1 } }] }
  ] },
  { id: "family_move", promptKey: "event.family_move", domain: "family", minAge: 0, maxAge: 17, weight: 2, choices: [
    { id: "adapt", labelKey: "choice.adapt", effects: [{ stats: { smarts: 1, happiness: -1 }, relationship: 1 }] },
    { id: "complain", labelKey: "choice.complain", effects: [{ stats: { happiness: -3 }, relationship: -2 }] }
  ] },
  { id: "grandparent_story", promptKey: "event.grandparent_story", domain: "family", minAge: 4, weight: 3, choices: [
    { id: "listen", labelKey: "choice.listen", effects: [{ stats: { smarts: 2, happiness: 1 }, relationship: 2 }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ relationship: -1, stats: { happiness: 1 } }] }
  ] },
  { id: "family_pet", promptKey: "event.family_pet", domain: "family", minAge: 3, maxAge: 18, weight: 3, choices: [
    { id: "care", labelKey: "choice.care", effects: [{ stats: { happiness: 3, health: 1 }, relationship: 1 }] },
    { id: "avoid", labelKey: "choice.avoid", effects: [{ stats: { happiness: -1 }, relationship: -1 }] }
  ] },
  { id: "holiday_dinner", promptKey: "event.holiday_dinner", domain: "family", minAge: 0, weight: 3, choices: [
    { id: "join", labelKey: "choice.join", effects: [{ relationship: 3, stats: { happiness: 2 } }] },
    { id: "leave", labelKey: "choice.leave", effects: [{ relationship: -3, stats: { happiness: -1 } }] }
  ] },
  { id: "cousin_visit", promptKey: "event.cousin_visit", domain: "family", minAge: 6, maxAge: 20, weight: 2, choices: [
    { id: "play", labelKey: "choice.play", effects: [{ stats: { happiness: 3 }, relationship: 2 }] },
    { id: "hide", labelKey: "choice.hide", effects: [{ stats: { happiness: -1 }, relationship: -1 }] }
  ] },
  { id: "parent_advice", promptKey: "event.parent_advice", domain: "family", minAge: 12, weight: 3, choices: [
    { id: "listen", labelKey: "choice.listen", effects: [{ stats: { smarts: 2 }, relationship: 2 }] },
    { id: "argue", labelKey: "choice.argue", effects: [{ stats: { happiness: -2 }, relationship: -3 }] }
  ] },
  { id: "family_budget", promptKey: "event.family_budget", domain: "family", minAge: 12, weight: 2, choices: [
    { id: "save", labelKey: "choice.save", effects: [{ cash: 120, stats: { smarts: 1 }, relationship: 1 }] },
    { id: "spend", labelKey: "choice.spend", effects: [{ cash: -80, stats: { happiness: 2 }, relationship: -1 }] }
  ] },
  { id: "family_reunion", promptKey: "event.family_reunion", domain: "family", minAge: 10, weight: 2, choices: [
    { id: "attend", labelKey: "choice.attend", effects: [{ relationship: 4, stats: { happiness: 2 } }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ relationship: -2, stats: { happiness: 1 } }] }
  ] },
  { id: "school_quiz", promptKey: "event.school_quiz", domain: "school", minAge: 6, maxAge: 22, weight: 5, choices: [
    { id: "study", labelKey: "choice.study", effects: [{ stats: { smarts: 4, happiness: -1 } }] },
    { id: "wing_it", labelKey: "choice.wing_it", effects: [{ stats: { happiness: 1, smarts: -1 } }] }
  ] },
  { id: "group_project", promptKey: "event.group_project", domain: "school", minAge: 8, maxAge: 22, weight: 4, choices: [
    { id: "lead", labelKey: "choice.lead", effects: [{ stats: { smarts: 2 }, relationship: 2 }] },
    { id: "coast", labelKey: "choice.coast", effects: [{ stats: { smarts: -1, happiness: 1 }, relationship: -2 }] }
  ] },
  { id: "science_fair", promptKey: "event.science_fair", domain: "school", minAge: 10, maxAge: 18, weight: 3, choices: [
    { id: "prepare", labelKey: "choice.prepare", effects: [{ stats: { smarts: 4, happiness: -1 } }] },
    { id: "simple", labelKey: "choice.simple", effects: [{ stats: { smarts: 1, happiness: 1 } }] }
  ] },
  { id: "class_speech", promptKey: "event.class_speech", domain: "school", minAge: 8, maxAge: 22, weight: 3, choices: [
    { id: "practice", labelKey: "choice.practice", effects: [{ stats: { smarts: 2, looks: 1 }, relationship: 1 }] },
    { id: "avoid", labelKey: "choice.avoid", effects: [{ stats: { happiness: -1, smarts: -1 } }] }
  ] },
  { id: "bully_note", promptKey: "event.bully_note", domain: "school", minAge: 7, maxAge: 18, weight: 2, choices: [
    { id: "report", labelKey: "choice.report", effects: [{ relationship: 1, stats: { happiness: -1, smarts: 1 } }] },
    { id: "fight", labelKey: "choice.fight", effects: [{ stats: { health: -2, happiness: -1 }, addFlag: "school_fight" }] }
  ] },
  { id: "teacher_praise", promptKey: "event.teacher_praise", domain: "school", minAge: 6, maxAge: 22, weight: 4, choices: [
    { id: "thank", labelKey: "choice.thank", effects: [{ stats: { happiness: 2, smarts: 1 } }] },
    { id: "brag", labelKey: "choice.brag", effects: [{ stats: { happiness: 1 }, relationship: -1 }] }
  ] },
  { id: "exam_week", promptKey: "event.exam_week", domain: "school", minAge: 12, maxAge: 24, weight: 4, choices: [
    { id: "focus", labelKey: "choice.focus", effects: [{ stats: { smarts: 5, happiness: -2 } }] },
    { id: "rest", labelKey: "choice.sleep", effects: [{ stats: { health: 2, smarts: -1 } }] }
  ] },
  { id: "club_election", promptKey: "event.club_election", domain: "school", minAge: 10, maxAge: 22, weight: 2, choices: [
    { id: "run", labelKey: "choice.run", effects: [{ stats: { smarts: 1, happiness: 2 }, relationship: 2 }] },
    { id: "support", labelKey: "choice.support", effects: [{ relationship: 2, stats: { happiness: 1 } }] }
  ] },
  { id: "late_homework", promptKey: "event.late_homework", domain: "school", minAge: 6, maxAge: 22, weight: 3, choices: [
    { id: "finish", labelKey: "choice.finish", effects: [{ stats: { smarts: 2, happiness: -2 } }] },
    { id: "excuse", labelKey: "choice.excuse", effects: [{ stats: { smarts: -1, happiness: -1 }, addFlag: "made_excuse" }] }
  ] },
  { id: "campus_trip", promptKey: "event.campus_trip", domain: "school", minAge: 10, maxAge: 22, weight: 2, choices: [
    { id: "join", labelKey: "choice.join", effects: [{ stats: { happiness: 3, smarts: 1 }, cash: -40 }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ stats: { happiness: -1 } }] }
  ] },
  { id: "job_offer", promptKey: "event.job_offer", domain: "career", minAge: 18, weight: 3, choices: [
    { id: "accept", labelKey: "choice.accept", effects: [{ cash: 700, stats: { happiness: 2 } }] },
    { id: "decline", labelKey: "choice.decline", effects: [{ stats: { happiness: -1 } }] }
  ] },
  { id: "project_mistake", promptKey: "event.project_mistake", domain: "career", minAge: 18, weight: 3, choices: [
    { id: "apologize", labelKey: "choice.apologize", effects: [{ stats: { smarts: 1, happiness: -1 } }] },
    { id: "argue", labelKey: "choice.argue", effects: [{ stats: { happiness: -4 }, addFlag: "work_conflict" }] }
  ] },
  { id: "rush_gig", promptKey: "event.rush_gig", domain: "career", minAge: 18, weight: 3, choices: [
    { id: "accept", labelKey: "choice.accept", effects: [{ cash: 350, stats: { happiness: -2, health: -1 } }] },
    { id: "decline", labelKey: "choice.decline", effects: [{ stats: { happiness: 1 } }] }
  ] },
  { id: "mentor_lunch", promptKey: "event.mentor_lunch", domain: "career", minAge: 18, weight: 2, choices: [
    { id: "listen", labelKey: "choice.listen", effects: [{ stats: { smarts: 3 }, relationship: 1, cash: -30 }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ stats: { happiness: 1, smarts: -1 } }] }
  ] },
  { id: "skill_showcase", promptKey: "event.skill_showcase", domain: "career", minAge: 20, weight: 2, choices: [
    { id: "prepare", labelKey: "choice.prepare", effects: [{ stats: { smarts: 2, happiness: -1 }, cash: 500 }] },
    { id: "wing_it", labelKey: "choice.wing_it", effects: [{ stats: { happiness: -1 }, cash: 100 }] }
  ] },
  { id: "collaboration_gossip", promptKey: "event.collaboration_gossip", domain: "career", minAge: 18, weight: 2, choices: [
    { id: "avoid", labelKey: "choice.avoid", effects: [{ stats: { smarts: 1 }, relationship: 1 }] },
    { id: "join", labelKey: "choice.join", effects: [{ relationship: -2, stats: { happiness: 1 } }] }
  ] },
  { id: "public_praise", promptKey: "event.public_praise", domain: "career", minAge: 18, weight: 3, choices: [
    { id: "thank", labelKey: "choice.thank", effects: [{ stats: { happiness: 2 }, cash: 150 }] },
    { id: "brag", labelKey: "choice.brag", effects: [{ stats: { happiness: 1 }, relationship: -1 }] }
  ] },
  { id: "burnout_warning", promptKey: "event.burnout_warning", domain: "career", minAge: 18, weight: 2, choices: [
    { id: "rest", labelKey: "choice.sleep", effects: [{ stats: { health: 2, happiness: 1 } }] },
    { id: "push", labelKey: "choice.push", effects: [{ stats: { health: -4, smarts: 1 }, addDiseaseId: "burnout" }] }
  ] },
  { id: "resume_gap", promptKey: "event.resume_gap", domain: "career", minAge: 18, weight: 2, choices: [
    { id: "explain", labelKey: "choice.explain", effects: [{ stats: { smarts: 1, happiness: -1 } }] },
    { id: "hide", labelKey: "choice.hide", effects: [{ stats: { happiness: -2 }, addFlag: "hid_resume_gap" }] }
  ] },
  { id: "new_collaborator", promptKey: "event.new_collaborator", domain: "career", minAge: 18, weight: 3, choices: [
    { id: "adapt", labelKey: "choice.adapt", effects: [{ relationship: 2, stats: { smarts: 1 } }] },
    { id: "resist", labelKey: "choice.resist", effects: [{ relationship: -3, stats: { happiness: -1 } }] }
  ] },
  { id: "fever", promptKey: "event.fever", domain: "health", minAge: 0, weight: 3, choices: [
    { id: "doctor", labelKey: "choice.doctor", effects: [{ cash: -120, stats: { health: 4 } }] },
    { id: "sleep", labelKey: "choice.sleep", effects: [{ stats: { health: -3, happiness: -1 }, addDiseaseId: "cold" }] }
  ] },
  { id: "bad_food", promptKey: "event.bad_food", domain: "health", minAge: 6, weight: 2, choices: [
    { id: "doctor", labelKey: "choice.doctor", effects: [{ cash: -100, stats: { health: 2 } }] },
    { id: "sleep", labelKey: "choice.sleep", effects: [{ stats: { health: -5 }, addDiseaseId: "food_poisoning" }] }
  ] },
  { id: "sprained_ankle_event", promptKey: "event.sprained_ankle", domain: "health", minAge: 6, weight: 2, choices: [
    { id: "rest", labelKey: "choice.sleep", effects: [{ stats: { health: 1, happiness: -1 }, addDiseaseId: "sprained_ankle" }] },
    { id: "ignore", labelKey: "choice.ignore", effects: [{ stats: { health: -3, happiness: 1 } }] }
  ] },
  { id: "stress_headache", promptKey: "event.stress_headache", domain: "health", minAge: 12, weight: 3, choices: [
    { id: "rest", labelKey: "choice.sleep", effects: [{ stats: { health: 2, happiness: 1 } }] },
    { id: "push", labelKey: "choice.push", effects: [{ stats: { health: -2, smarts: 1 }, addDiseaseId: "migraine" }] }
  ] },
  { id: "allergy_season", promptKey: "event.allergy_season", domain: "health", minAge: 4, weight: 3, choices: [
    { id: "doctor", labelKey: "choice.doctor", effects: [{ cash: -80, stats: { health: 2 } }] },
    { id: "ignore", labelKey: "choice.ignore", effects: [{ stats: { health: -2 }, addDiseaseId: "allergy" }] }
  ] },
  { id: "sleepless_week", promptKey: "event.sleepless_week", domain: "health", minAge: 14, weight: 2, choices: [
    { id: "routine", labelKey: "choice.routine", effects: [{ stats: { health: 2, happiness: 1 } }] },
    { id: "scroll", labelKey: "choice.scroll", effects: [{ stats: { health: -3, happiness: -1 }, addDiseaseId: "insomnia" }] }
  ] },
  { id: "dental_pain", promptKey: "event.dental_pain", domain: "health", minAge: 6, weight: 2, choices: [
    { id: "doctor", labelKey: "choice.doctor", effects: [{ cash: -180, stats: { health: 3 } }] },
    { id: "ignore", labelKey: "choice.ignore", effects: [{ stats: { health: -3, happiness: -2 } }] }
  ] },
  { id: "fitness_slump", promptKey: "event.fitness_slump", domain: "health", minAge: 12, weight: 3, choices: [
    { id: "exercise", labelKey: "choice.exercise", effects: [{ stats: { health: 3, happiness: 1 } }] },
    { id: "rest", labelKey: "choice.sleep", effects: [{ stats: { health: -1, happiness: 1 } }] }
  ] },
  { id: "flu_wave", promptKey: "event.flu_wave", domain: "health", minAge: 0, weight: 2, choices: [
    { id: "care", labelKey: "choice.care", effects: [{ cash: -90, stats: { health: 2 } }] },
    { id: "ignore", labelKey: "choice.ignore", effects: [{ stats: { health: -4 }, addDiseaseId: "flu" }] }
  ] },
  { id: "back_pain_event", promptKey: "event.back_pain", domain: "health", minAge: 20, weight: 2, choices: [
    { id: "stretch", labelKey: "choice.stretch", effects: [{ stats: { health: 2, happiness: 1 } }] },
    { id: "push", labelKey: "choice.push", effects: [{ stats: { health: -2 }, addDiseaseId: "back_pain" }] }
  ] },
  { id: "checkup_notice", promptKey: "event.checkup_notice", domain: "health", minAge: 18, weight: 2, choices: [
    { id: "doctor", labelKey: "choice.doctor", effects: [{ cash: -160, stats: { health: 4 } }] },
    { id: "delay", labelKey: "choice.delay", effects: [{ stats: { health: -1, happiness: 1 } }] }
  ] },
  { id: "blood_pressure", promptKey: "event.blood_pressure", domain: "health", minAge: 35, weight: 2, choices: [
    { id: "change", labelKey: "choice.change", effects: [{ stats: { health: 3, happiness: -1 } }] },
    { id: "ignore", labelKey: "choice.ignore", effects: [{ stats: { health: -4 }, addDiseaseId: "high_blood_pressure" }] }
  ] },
  { id: "friend_secret", promptKey: "event.friend_secret", domain: "relationship", minAge: 10, weight: 3, choices: [
    { id: "listen", labelKey: "choice.listen", effects: [{ relationship: 5, stats: { happiness: 1 } }] },
    { id: "joke", labelKey: "choice.joke", effects: [{ relationship: -4, stats: { happiness: -1 } }] }
  ] },
  { id: "crush_message", promptKey: "event.crush_message", domain: "relationship", minAge: 14, weight: 2, choices: [
    { id: "accept", labelKey: "choice.accept", effects: [{ relationship: 5, stats: { happiness: 4 } }] },
    { id: "decline", labelKey: "choice.decline", effects: [{ stats: { happiness: -1 } }] }
  ] },
  { id: "new_friend", promptKey: "event.new_friend", domain: "relationship", minAge: 6, weight: 4, choices: [
    { id: "invite", labelKey: "choice.invite", effects: [{ relationship: 4, stats: { happiness: 2 } }] },
    { id: "wait", labelKey: "choice.wait", effects: [{ relationship: 1, stats: { happiness: -1 } }] }
  ] },
  { id: "friend_needs_money", promptKey: "event.friend_needs_money", domain: "relationship", minAge: 16, weight: 2, choices: [
    { id: "lend", labelKey: "choice.lend", effects: [{ cash: -120, relationship: 4 }] },
    { id: "decline", labelKey: "choice.decline", effects: [{ relationship: -2, stats: { happiness: -1 } }] }
  ] },
  { id: "date_cancelled", promptKey: "event.date_cancelled", domain: "relationship", minAge: 16, weight: 3, choices: [
    { id: "understand", labelKey: "choice.understand", effects: [{ relationship: 2, stats: { happiness: -1 } }] },
    { id: "argue", labelKey: "choice.argue", effects: [{ relationship: -4, stats: { happiness: -2 } }] }
  ] },
  { id: "roommate_mess", promptKey: "event.roommate_mess", domain: "relationship", minAge: 18, weight: 2, choices: [
    { id: "talk", labelKey: "choice.talk", effects: [{ relationship: 2, stats: { happiness: 1 } }] },
    { id: "ignore", labelKey: "choice.ignore", effects: [{ relationship: -2, stats: { happiness: -1 } }] }
  ] },
  { id: "old_friend_returns", promptKey: "event.old_friend_returns", domain: "relationship", minAge: 18, weight: 2, choices: [
    { id: "meet", labelKey: "choice.meet", effects: [{ relationship: 3, stats: { happiness: 2 }, cash: -40 }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ relationship: -1, stats: { happiness: -1 } }] }
  ] },
  { id: "partner_promotion", promptKey: "event.partner_promotion", domain: "relationship", minAge: 18, weight: 2, choices: [
    { id: "celebrate", labelKey: "choice.celebrate", effects: [{ cash: -100, relationship: 4, stats: { happiness: 2 } }] },
    { id: "downplay", labelKey: "choice.downplay", effects: [{ relationship: -3, stats: { happiness: -1 } }] }
  ] },
  { id: "friend_group_trip", promptKey: "event.friend_group_trip", domain: "relationship", minAge: 16, weight: 2, choices: [
    { id: "join", labelKey: "choice.join", effects: [{ cash: -220, relationship: 3, stats: { happiness: 3 } }] },
    { id: "save", labelKey: "choice.save", effects: [{ cash: 120, relationship: -1, stats: { happiness: -1 } }] }
  ] },
  { id: "jealous_moment", promptKey: "event.jealous_moment", domain: "relationship", minAge: 16, weight: 2, choices: [
    { id: "talk", labelKey: "choice.talk", effects: [{ relationship: 2, stats: { happiness: 1 } }] },
    { id: "accuse", labelKey: "choice.accuse", effects: [{ relationship: -5, stats: { happiness: -2 } }] }
  ] },
  { id: "neighbor_help", promptKey: "event.neighbor_help", domain: "relationship", minAge: 12, weight: 2, choices: [
    { id: "help", labelKey: "choice.help", effects: [{ relationship: 2, stats: { happiness: 2 } }] },
    { id: "avoid", labelKey: "choice.avoid", effects: [{ relationship: -1, stats: { happiness: -1 } }] }
  ] },
  { id: "online_argument", promptKey: "event.online_argument", domain: "relationship", minAge: 13, weight: 2, choices: [
    { id: "leave", labelKey: "choice.leave", effects: [{ stats: { happiness: 1, smarts: 1 } }] },
    { id: "argue", labelKey: "choice.argue", effects: [{ relationship: -2, stats: { happiness: -2 } }] }
  ] },
  { id: "weird_neighbor", promptKey: "event.weird_neighbor", domain: "misc", minAge: 4, weight: 1, choices: [
    { id: "listen", labelKey: "choice.listen", effects: [{ stats: { happiness: 2, smarts: 1 } }] },
    { id: "joke", labelKey: "choice.joke", effects: [{ stats: { happiness: 3, looks: -1 } }] }
  ] },
  { id: "lost_wallet", promptKey: "event.lost_wallet", domain: "misc", minAge: 10, weight: 3, choices: [
    { id: "return", labelKey: "choice.return", effects: [{ stats: { happiness: 3 }, cash: 50 }] },
    { id: "keep", labelKey: "choice.keep", effects: [{ stats: { happiness: -2 }, cash: 300, addFlag: "kept_wallet" }] }
  ] },
  { id: "quiet_year", promptKey: "event.quiet_year", domain: "misc", minAge: 0, weight: 6, choices: [
    { id: "rest", labelKey: "choice.sleep", effects: [{ stats: { happiness: 1, health: 1 } }] },
    { id: "study", labelKey: "choice.study", effects: [{ stats: { smarts: 1 } }] }
  ] },
  { id: "rainy_weekend", promptKey: "event.rainy_weekend", domain: "misc", minAge: 0, weight: 4, choices: [
    { id: "read", labelKey: "choice.read", effects: [{ stats: { smarts: 2, happiness: 1 } }] },
    { id: "nap", labelKey: "choice.sleep", effects: [{ stats: { health: 1, happiness: 2 } }] }
  ] },
  { id: "phone_breaks", promptKey: "event.phone_breaks", domain: "misc", minAge: 12, weight: 2, choices: [
    { id: "repair", labelKey: "choice.repair", effects: [{ cash: -180, stats: { happiness: 1 } }] },
    { id: "delay", labelKey: "choice.delay", effects: [{ stats: { happiness: -2 }, cash: 40 }] }
  ] },
  { id: "street_performer", promptKey: "event.street_performer", domain: "misc", minAge: 6, weight: 2, choices: [
    { id: "tip", labelKey: "choice.tip", effects: [{ cash: -20, stats: { happiness: 2 } }] },
    { id: "watch", labelKey: "choice.watch", effects: [{ stats: { happiness: 1 } }] }
  ] },
  { id: "lottery_ad", promptKey: "event.lottery_ad", domain: "misc", minAge: 18, weight: 1, choices: [
    { id: "buy", labelKey: "choice.buy", effects: [{ cash: -20, stats: { happiness: 1 }, addFlag: "bought_lottery" }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ stats: { smarts: 1 } }] }
  ] },
  { id: "found_book", promptKey: "event.found_book", domain: "misc", minAge: 8, weight: 3, choices: [
    { id: "read", labelKey: "choice.read", effects: [{ stats: { smarts: 3, happiness: 1 } }] },
    { id: "sell", labelKey: "choice.sell", effects: [{ cash: 40, stats: { happiness: 1 } }] }
  ] },
  { id: "local_festival", promptKey: "event.local_festival", domain: "misc", minAge: 4, weight: 3, choices: [
    { id: "attend", labelKey: "choice.attend", effects: [{ cash: -50, stats: { happiness: 3 }, relationship: 1 }] },
    { id: "stay", labelKey: "choice.stay", effects: [{ stats: { health: 1, happiness: -1 } }] }
  ] },
  { id: "small_theft", promptKey: "event.small_theft", domain: "misc", minAge: 12, weight: 1, choices: [
    { id: "report", labelKey: "choice.report", effects: [{ stats: { happiness: 1, smarts: 1 } }] },
    { id: "ignore", labelKey: "choice.ignore", effects: [{ cash: -40, stats: { happiness: -1 } }] }
  ] },
  { id: "new_hobby", promptKey: "event.new_hobby", domain: "misc", minAge: 10, weight: 3, choices: [
    { id: "try", labelKey: "choice.try", effects: [{ cash: -60, stats: { happiness: 3, smarts: 1 } }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ stats: { happiness: -1 } }] }
  ] },
  { id: "power_outage", promptKey: "event.power_outage", domain: "misc", minAge: 0, weight: 2, choices: [
    { id: "adapt", labelKey: "choice.adapt", effects: [{ stats: { smarts: 1, happiness: 1 } }] },
    { id: "complain", labelKey: "choice.complain", effects: [{ stats: { happiness: -2 } }] }
  ] },
  { id: "public_survey", promptKey: "event.public_survey", domain: "misc", minAge: 16, weight: 2, choices: [
    { id: "answer", labelKey: "choice.answer", effects: [{ cash: 20, stats: { smarts: 1 } }] },
    { id: "skip", labelKey: "choice.skip", effects: [{ stats: { happiness: 1 } }] }
  ] },
  { id: "lucky_coupon", promptKey: "event.lucky_coupon", domain: "misc", minAge: 12, weight: 2, choices: [
    { id: "use", labelKey: "choice.use", effects: [{ cash: 60, stats: { happiness: 2 } }] },
    { id: "forget", labelKey: "choice.forget", effects: [{ stats: { happiness: -1 } }] }
  ] },
  { id: "quiet_kindness", promptKey: "event.quiet_kindness", domain: "misc", minAge: 8, weight: 2, choices: [
    { id: "help", labelKey: "choice.help", effects: [{ stats: { happiness: 2 }, relationship: 1 }] },
    { id: "walk", labelKey: "choice.walk", effects: [{ stats: { happiness: -1 } }] }
  ] }
] satisfies GameCatalog["events"];
