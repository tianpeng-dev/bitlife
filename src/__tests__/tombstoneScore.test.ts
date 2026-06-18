import { computeTombstoneScore } from "../../netlify/functions/lib/tombstoneSchema";

describe("computeTombstoneScore", () => {
  it("uses public outcome fields instead of the submitted score", () => {
    const score = computeTombstoneScore({
      seed: "seed",
      ageAtDeath: 80,
      causeOfDeath: "old_age",
      summary: "A quiet life.",
      tags: ["long_life"],
      score: 999999,
      stats: { happiness: 80, health: 70, smarts: 60, looks: 50 },
      netWorth: 250000,
      careerTitle: "writer",
      highestEducation: "graduated"
    });

    expect(score).toBe(1720);
  });
});
