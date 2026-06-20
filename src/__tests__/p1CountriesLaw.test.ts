import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import {
  activityDeniedByLaw,
  assetPriceWithCountryMultiplier,
  countryLawFor,
  sentenceYearsForCrime
} from "../domain/p1/countriesLaw";

describe("P1 countries and law", () => {
  it("finds country law for a life country", () => {
    const life = { ...generateLife({ seed: "law-us", catalog }), countryId: "us" };

    expect(countryLawFor(life, catalog).countryId).toBe("us");
  });

  it("throws when a life country has no country law", () => {
    const life = { ...generateLife({ seed: "law-unknown", catalog }), countryId: "unknown" };

    expect(() => countryLawFor(life, catalog)).toThrow("Missing P1 country law for unknown");
  });

  it("denies gambling when country law disallows it", () => {
    const life = { ...generateLife({ seed: "law-gambling", catalog }), age: 18, countryId: "cn" };

    const reason = activityDeniedByLaw(life, catalog, { law: "gambling" });

    expect(reason).toBe("law.gambling_illegal");
  });

  it("denies marriage when life is under the country marriage age", () => {
    const life = { ...generateLife({ seed: "law-marriage", catalog }), age: 19, countryId: "cn" };

    const reason = activityDeniedByLaw(life, catalog, { law: "marriage" });

    expect(reason).toBe("law.too_young_for_marriage");
  });

  it("denies emigration when immigration difficulty reaches the blocking threshold", () => {
    const emigrationCatalog = {
      ...catalog,
      p1: {
        ...catalog.p1,
        countryLaw: catalog.p1.countryLaw.map((law) =>
          law.countryId === "us" ? { ...law, immigrationDifficulty: 0.95 } : law
        )
      }
    };
    const life = { ...generateLife({ seed: "law-emigration", catalog }), age: 30, countryId: "us" };

    const reason = activityDeniedByLaw(life, emigrationCatalog, { law: "emigration" });

    expect(reason).toBe("law.emigration_blocked");
  });

  it("scales sentence length by country prison severity", () => {
    const lenient = { ...generateLife({ seed: "law-lenient", catalog }), countryId: "jp" };
    const strict = { ...generateLife({ seed: "law-strict", catalog }), countryId: "cn" };

    expect(sentenceYearsForCrime(lenient, catalog, 5)).toBe(6);
    expect(sentenceYearsForCrime(strict, catalog, 5)).toBe(7);
  });

  it("rounds asset prices after country multiplier and never returns negative values", () => {
    const usLife = { ...generateLife({ seed: "law-asset-us", catalog }), countryId: "us" };
    const brLife = { ...generateLife({ seed: "law-asset-br", catalog }), countryId: "br" };

    expect(assetPriceWithCountryMultiplier(usLife, catalog, 99)).toBe(109);
    expect(assetPriceWithCountryMultiplier(brLife, catalog, -10)).toBe(0);
  });
});
