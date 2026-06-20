import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { attemptCrime } from "../domain/p1/crimeJustice";
import { ensureP1State } from "../domain/p1/defaultState";
import { paroleAttempt, tickPrison } from "../domain/p1/prison";

describe("P1 crime and prison", () => {
  it("resolves a crime attempt into money or legal trouble", () => {
    const life = ensureP1State({ ...generateLife({ seed: "crime", catalog }), age: 25, cash: 1000 });
    const result = attemptCrime({ life, catalog, crimeId: "p1_crime_shoplifting" });

    expect(result.logs[0].messageKey.startsWith("p1.log.crime.")).toBe(true);
    expect(result.life.cash !== life.cash || result.life.legal.criminalRecord.length > 0).toBe(true);
  });

  it("puts convicted lives in prison with remaining sentence", () => {
    const life = ensureP1State({ ...generateLife({ seed: "crime-prison-1", catalog }), age: 25, cash: 1000, countryId: "us" });
    const result = attemptCrime({ life, catalog, crimeId: "p1_crime_bank_robbery", forceOutcome: "arrest" });

    expect(result.life.prison.inPrison).toBe(true);
    expect(result.life.prison.remainingYears).toBeGreaterThan(0);
  });

  it("ticks prison sentence down to release", () => {
    let life = ensureP1State({ ...generateLife({ seed: "prison-release", catalog }), age: 30 });
    life = { ...life, prison: { inPrison: true, sentenceYears: 1, remainingYears: 1, securityLevel: "minimum", behavior: 50, respect: 20 } };

    const result = tickPrison({ life: { ...life, age: 31 }, catalog });

    expect(result.life.prison.inPrison).toBe(false);
    expect(result.life.prison.remainingYears).toBe(0);
  });

  it("parole can reduce remaining sentence for good behavior", () => {
    const life = ensureP1State({ ...generateLife({ seed: "parole", catalog }), age: 30 });
    const prisoner = { ...life, prison: { inPrison: true, sentenceYears: 5, remainingYears: 3, securityLevel: "minimum" as const, behavior: 90, respect: 40 } };
    const result = paroleAttempt({ life: prisoner, catalog });

    expect(result.life.prison.remainingYears).toBeLessThanOrEqual(3);
  });
});
