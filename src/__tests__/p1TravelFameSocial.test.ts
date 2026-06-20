import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { ensureP1State } from "../domain/p1/defaultState";
import { createSocialAccount, postToSocial, tickFameSocial, unlockFame } from "../domain/p1/fameSocial";
import { attemptEmigration, takeVacation } from "../domain/p1/travelMigration";

describe("P1 travel, migration, fame, and social", () => {
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
