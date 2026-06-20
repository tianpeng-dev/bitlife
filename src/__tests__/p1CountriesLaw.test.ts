import { catalog } from "../content/catalog";
import { generateLife } from "../domain/lifeGenerator";
import { activityDeniedByLaw, countryLawFor, sentenceYearsForCrime } from "../domain/p1/countriesLaw";

describe("P1 countries and law", () => {
  it("finds country law for a life country", () => {
    const life = { ...generateLife({ seed: "law-us", catalog }), countryId: "us" };

    expect(countryLawFor(life, catalog).countryId).toBe("us");
  });

  it("denies gambling when country law disallows it", () => {
    const life = { ...generateLife({ seed: "law-gambling", catalog }), age: 18, countryId: "cn" };

    const reason = activityDeniedByLaw(life, catalog, { law: "gambling" });

    expect(reason).toBe("law.gambling_illegal");
  });

  it("scales sentence length by country prison severity", () => {
    const lenient = { ...generateLife({ seed: "law-lenient", catalog }), countryId: "uk" };
    const strict = { ...generateLife({ seed: "law-strict", catalog }), countryId: "us" };

    expect(sentenceYearsForCrime(strict, catalog, 5)).toBeGreaterThanOrEqual(sentenceYearsForCrime(lenient, catalog, 5));
  });
});
