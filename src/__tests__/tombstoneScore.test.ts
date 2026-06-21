import { computeTombstoneScore, tombstoneInputSchema } from "../../netlify/functions/lib/tombstoneSchema";
import { calculatePublicScore } from "../domain/scoring";

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
    expect(calculatePublicScore({ ageAtDeath: 80, stats: { happiness: 80, health: 70, smarts: 60, looks: 50 }, netWorth: 250000 })).toBe(
      score
    );
  });

  it("accepts bounded optional P1 public summary fields", () => {
    const p1 = {
      netWorth: 10_000_000_000,
      assetCount: 500,
      childrenCount: 200,
      petCount: 100,
      prisonYears: 500,
      fameScore: 100,
      countriesLived: 200
    };

    const parsed = tombstoneInputSchema.parse({
      seed: "seed",
      ageAtDeath: 80,
      causeOfDeath: "old_age",
      summary: "A quiet life.",
      tags: ["long_life"],
      score: 1200,
      stats: { happiness: 80, health: 70, smarts: 60, looks: 50 },
      netWorth: p1.netWorth,
      p1
    });

    expect(parsed.netWorth).toBe(p1.netWorth);
    expect(parsed.p1).toEqual(p1);
  });

  it("rejects P1 public summary values outside backend bounds", () => {
    const parsed = tombstoneInputSchema.safeParse({
      seed: "seed",
      ageAtDeath: 80,
      causeOfDeath: "old_age",
      summary: "A quiet life.",
      tags: ["long_life"],
      score: 1200,
      stats: { happiness: 80, health: 70, smarts: 60, looks: 50 },
      netWorth: 250000,
      p1: {
        netWorth: 10_000_000_001,
        assetCount: 1,
        childrenCount: 0,
        petCount: 0,
        prisonYears: 0,
        fameScore: 0,
        countriesLived: 1
      }
    });

    expect(parsed.success).toBe(false);
  });
});
