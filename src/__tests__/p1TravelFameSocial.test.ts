import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";
import { createSocialAccount, postToSocial, tickFameSocial, unlockFame } from "../domain/p1/fameSocial";
import { attemptEmigration, attemptIllegalEmigration, takeVacation } from "../domain/p1/travelMigration";

describe("P1 travel, migration, fame, and social", () => {
  const prison = { inPrison: true, sentenceYears: 1, remainingYears: 1, securityLevel: "minimum" as const, behavior: 50, respect: 20 };

  it("records vacation travel without changing residence", () => {
    const life = ensureP1State({ ...generateLife({ seed: "vacation", catalog }), age: 25, cash: 10000, countryId: "us" });
    const result = takeVacation({ life, catalog, toCountryId: "jp" });

    expect(result.life.countryId).toBe("us");
    expect(result.life.migrationHistory.at(-1)?.method).toBe("travel");
  });

  it("can legally emigrate and change country", () => {
    const life = ensureP1State({ ...generateLife({ seed: "emigrate", catalog }), age: 30, cash: 50000, countryId: "us" });
    const result = attemptEmigration({ life, catalog, toCountryId: "jp", forceApproved: true });

    expect(result.life.countryId).toBe("jp");
    expect(result.life.migrationHistory.at(-1)?.method).toBe("legal_emigration");
  });

  it("uses the catalog cost for legal emigration", () => {
    const legalMigration = catalog.p1.travelActivities.find((activity) => activity.id === "p1_migration_legal");
    const cost = Math.abs(legalMigration?.effects.cash ?? 0);
    const life = ensureP1State({ ...generateLife({ seed: "emigrate-catalog-cost", catalog }), age: 30, cash: cost, countryId: "us" });
    const result = attemptEmigration({ life, catalog, toCountryId: "jp", forceApproved: true });

    expect(cost).toBeGreaterThan(0);
    expect(result.life.cash).toBe(0);
    expect(result.life.countryId).toBe("jp");
  });

  it("blocks legal emigration when the current country law denies emigration even when approval is forced", () => {
    const emigrationCatalog = {
      ...catalog,
      p1: {
        ...catalog.p1,
        countryLaw: catalog.p1.countryLaw.map((law) =>
          law.countryId === "us" ? { ...law, immigrationDifficulty: 0.95 } : law
        )
      }
    };
    const life = ensureP1State({ ...generateLife({ seed: "emigration-law", catalog }), age: 30, cash: 50000, countryId: "us" });

    expect(() => attemptEmigration({ life, catalog: emigrationCatalog, toCountryId: "jp", forceApproved: true })).toThrow(
      "law.emigration_blocked"
    );
  });

  it("blocks vacation while imprisoned", () => {
    const life = ensureP1State({ ...generateLife({ seed: "vacation-prison", catalog }), age: 25, cash: 10000, countryId: "us", prison });

    expect(() => takeVacation({ life, catalog, toCountryId: "jp" })).toThrow("prison.normal_activity_denied");
  });

  it("blocks legal emigration while imprisoned", () => {
    const life = ensureP1State({ ...generateLife({ seed: "emigration-prison", catalog }), age: 30, cash: 50000, countryId: "us", prison });

    expect(() => attemptEmigration({ life, catalog, toCountryId: "jp", forceApproved: true })).toThrow("prison.normal_activity_denied");
  });

  it("blocks illegal emigration while imprisoned", () => {
    const life = ensureP1State({ ...generateLife({ seed: "illegal-emigration-prison", catalog }), age: 30, cash: 50000, countryId: "us", prison });

    expect(() => attemptIllegalEmigration({ life, catalog, toCountryId: "jp", forceOutcome: "success" })).toThrow(
      "prison.normal_activity_denied"
    );
  });

  it("unlocks fame and lets social posts change followers", () => {
    let life = ensureP1State({ ...generateLife({ seed: "fame", catalog }), age: 25, cash: 10000 });
    life = unlockFame({ life, source: "career.actor" }).life;
    life = createSocialAccount({ life, catalog, platformId: "p1_social_short_video" }).life;
    const posted = postToSocial({ life, catalog, accountId: life.socialAccounts[0].id }).life;

    expect(posted.fame.score).toBeGreaterThan(0);
    expect(posted.socialAccounts[0].followers).toBeGreaterThanOrEqual(life.socialAccounts[0].followers);
  });

  it("fame decays during yearly tick", () => {
    const famous = unlockFame({ life: ensureP1State({ ...generateLife({ seed: "fame-decay", catalog }), age: 30 }), source: "career.actor" }).life;
    const ticked = tickFameSocial({ life: { ...famous, age: 31 }, catalog }).life;

    expect(ticked.fame.score).toBeLessThanOrEqual(famous.fame.score);
  });
});
