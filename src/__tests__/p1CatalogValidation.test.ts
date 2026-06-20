import { catalog } from "../content/catalog";
import { p1Catalog } from "../content/p1/catalog";
import { validateP1Catalog } from "../content/p1/validation";
import { validateCatalog } from "../content/schema";

describe("P1 catalog validation", () => {
  it("loads all P1 catalog modules", () => {
    expect(p1Catalog.assets.length).toBeGreaterThanOrEqual(6);
    expect(p1Catalog.crimes.length).toBeGreaterThanOrEqual(6);
    expect(p1Catalog.prisonActivities.length).toBeGreaterThanOrEqual(4);
    expect(p1Catalog.countryLaw.length).toBeGreaterThanOrEqual(5);
    expect(p1Catalog.fameActivities.length).toBeGreaterThanOrEqual(4);
    expect(p1Catalog.socialPlatforms.length).toBeGreaterThanOrEqual(3);
    expect(p1Catalog.pets.length).toBeGreaterThanOrEqual(5);
    expect(p1Catalog.travelActivities.length).toBeGreaterThanOrEqual(4);
    expect(p1Catalog.romanceActivities.length).toBeGreaterThanOrEqual(6);
  });

  it("validates P1 catalog and merged game catalog", () => {
    expect(() => validateP1Catalog(p1Catalog)).not.toThrow();
    expect(() => validateCatalog(catalog)).not.toThrow();
  });

  it("has country law for every starter country", () => {
    const countryLawIds = new Set(catalog.p1.countryLaw.map((law) => law.countryId));

    for (const country of catalog.countries) {
      expect(countryLawIds.has(country.id)).toBe(true);
    }
  });

  it("does not define country law for missing starter countries", () => {
    const countryIds = new Set(catalog.countries.map((country) => country.id));

    for (const law of catalog.p1.countryLaw) {
      expect(countryIds.has(law.countryId)).toBe(true);
    }
  });

  it("requires complete bilingual labels for visible P1 entries", () => {
    const invalid = structuredClone(p1Catalog);
    delete invalid.locales["en-US"]["p1.asset.compact_apartment.name"];

    expect(() => validateP1Catalog(invalid)).toThrow(/Missing en-US P1 locale keys: p1\.asset\.compact_apartment\.name/);
  });

  it("rejects copied reference expressions", () => {
    const invalid = structuredClone(p1Catalog);
    invalid.locales["zh-CN"]["p1.asset.compact_apartment.name"] = "BitLife Marketplace";

    expect(() => validateP1Catalog(invalid)).toThrow(/Forbidden P1 expression/);
  });

  it("rejects generated P1 sources without the generated prefix", () => {
    const invalid = structuredClone(p1Catalog);
    invalid.assets[0].source = "manual:p1:assets";

    expect(() => validateP1Catalog(invalid)).toThrow(/Invalid generated P1 source/);
  });
});
