import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { attemptCrime } from "../domain/p1/crimeJustice";
import { ensureP1State } from "../domain/p1/defaultState";
import { paroleAttempt, tickPrison } from "../domain/p1/prison";

describe("P1 crime and prison", () => {
  it("applies forced successful crime rewards without legal trouble", () => {
    const life = ensureP1State({ ...generateLife({ seed: "crime-success", catalog }), age: 25, cash: 1000 });
    const result = attemptCrime({ life, catalog, crimeId: "p1_crime_shoplifting", forceOutcome: "success" });

    expect(result.logs[0].messageKey).toBe("p1.log.crime.success");
    expect(result.life.cash).toBeGreaterThanOrEqual(life.cash + 20);
    expect(result.life.cash).toBeLessThanOrEqual(life.cash + 250);
    expect(result.life.legal.wantedLevel).toBe(life.legal.wantedLevel);
    expect(result.life.legal.criminalRecord).toHaveLength(0);
    expect(result.life.prison.inPrison).toBe(false);
  });

  it("applies forced failed crime wanted increase without prison or cash reward", () => {
    const life = ensureP1State({ ...generateLife({ seed: "crime-fail", catalog }), age: 25, cash: 1000 });
    const result = attemptCrime({ life, catalog, crimeId: "p1_crime_burglary", forceOutcome: "fail" });

    expect(result.logs[0].messageKey).toBe("p1.log.crime.fail");
    expect(result.life.cash).toBe(life.cash);
    expect(result.life.legal.wantedLevel).toBe(4);
    expect(result.life.legal.criminalRecord).toHaveLength(0);
    expect(result.life.prison.inPrison).toBe(false);
  });

  it("applies forced crime arrest with record and prison sentence", () => {
    const life = ensureP1State({ ...generateLife({ seed: "crime-prison-1", catalog }), age: 25, cash: 1000, countryId: "us" });
    const result = attemptCrime({ life, catalog, crimeId: "p1_crime_bank_robbery", forceOutcome: "arrest" });

    expect(result.logs[0].messageKey).toBe("p1.log.crime.arrest");
    expect(result.life.cash).toBe(life.cash);
    expect(result.life.legal.wantedLevel).toBe(0);
    expect(result.life.legal.criminalRecord).toHaveLength(1);
    expect(result.life.legal.criminalRecord[0]).toMatchObject({
      crimeId: "p1_crime_bank_robbery",
      age: 25,
      convicted: true
    });
    expect(result.life.prison.inPrison).toBe(true);
    expect(result.life.prison.remainingYears).toBeGreaterThan(0);
    expect(result.life.prison.remainingYears).toBe(result.life.prison.sentenceYears);
    expect(result.life.prison.securityLevel).toBe("maximum");
    expect(result.life.prison.behavior).toBe(50);
    expect(result.life.prison.respect).toBe(64);
  });

  it("rejects crime attempts while already in prison", () => {
    const life = ensureP1State({ ...generateLife({ seed: "crime-in-prison", catalog }), age: 25, cash: 1000 });
    const prisoner = { ...life, prison: { inPrison: true, sentenceYears: 1, remainingYears: 1, securityLevel: "minimum" as const, behavior: 50, respect: 20 } };

    expect(() => attemptCrime({ life: prisoner, catalog, crimeId: "p1_crime_shoplifting" })).toThrow("crime.in_prison");
  });

  it("ticks prison sentence down to release", () => {
    let life = ensureP1State({ ...generateLife({ seed: "prison-release", catalog }), age: 30 });
    life = { ...life, prison: { inPrison: true, sentenceYears: 1, remainingYears: 1, securityLevel: "minimum", behavior: 50, respect: 20 } };

    const result = tickPrison({ life: { ...life, age: 31 }, catalog });

    expect(result.life.prison.inPrison).toBe(false);
    expect(result.life.prison.remainingYears).toBe(0);
  });

  it("parole releases immediately when remaining sentence is negative", () => {
    const life = ensureP1State({ ...generateLife({ seed: "parole-negative", catalog }), age: 30 });
    const prisoner = { ...life, prison: { inPrison: true, sentenceYears: 5, remainingYears: -2, securityLevel: "minimum" as const, behavior: 10, respect: 40 } };
    const result = paroleAttempt({ life: prisoner, catalog });

    expect(result.logs[0].messageKey).toBe("p1.log.prison.release");
    expect(result.life.prison.inPrison).toBe(false);
    expect(result.life.prison.remainingYears).toBe(0);
  });

  it("parole releases immediately when remaining sentence is zero", () => {
    const life = ensureP1State({ ...generateLife({ seed: "parole-zero", catalog }), age: 30 });
    const prisoner = { ...life, prison: { inPrison: true, sentenceYears: 5, remainingYears: 0, securityLevel: "minimum" as const, behavior: 10, respect: 40 } };
    const result = paroleAttempt({ life: prisoner, catalog });

    expect(result.logs[0].messageKey).toBe("p1.log.prison.release");
    expect(result.life.prison.inPrison).toBe(false);
    expect(result.life.prison.remainingYears).toBe(0);
  });

  it("parole can reduce remaining sentence for good behavior", () => {
    const life = ensureP1State({ ...generateLife({ seed: "parole", catalog }), age: 30 });
    const prisoner = { ...life, prison: { inPrison: true, sentenceYears: 5, remainingYears: 3, securityLevel: "minimum" as const, behavior: 90, respect: 40 } };
    const result = paroleAttempt({ life: prisoner, catalog });

    expect(result.life.prison.remainingYears).toBeLessThanOrEqual(3);
  });

  it("parole denial clamps behavior, respect, and remaining sentence", () => {
    const life = ensureP1State({ ...generateLife({ seed: "parole-clamp", catalog }), age: 30 });
    const prisoner = { ...life, prison: { inPrison: true, sentenceYears: 5, remainingYears: 3, securityLevel: "medium" as const, behavior: -20, respect: 150 } };
    const result = paroleAttempt({ life: prisoner, catalog });

    expect(result.logs[0].messageKey).toBe("p1.log.prison.parole_denied");
    expect(result.life.prison.inPrison).toBe(true);
    expect(result.life.prison.remainingYears).toBe(3);
    expect(result.life.prison.behavior).toBe(0);
    expect(result.life.prison.respect).toBe(100);
  });
});
