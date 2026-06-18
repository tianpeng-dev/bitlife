import { catalog } from "../content/catalog";
import type { GameCatalog } from "../content/schema";
import { requiredGeneratedLocaleKeys, validateCatalog } from "../content/schema";

describe("content catalog", () => {
  function cloneCatalog(): GameCatalog {
    return structuredClone(catalog);
  }

  it("passes schema validation", () => {
    expect(() => validateCatalog(catalog)).not.toThrow();
  });

  it("ships minimum starter content for the vertical slice", () => {
    expect(catalog.countries.length).toBeGreaterThanOrEqual(5);
    expect(catalog.activities.length).toBeGreaterThanOrEqual(8);
    expect(catalog.events.length).toBeGreaterThanOrEqual(12);
    expect(catalog.careers.length).toBeGreaterThanOrEqual(6);
    expect(catalog.diseases.length).toBeGreaterThanOrEqual(4);
    expect(catalog.achievements.length).toBeGreaterThanOrEqual(6);
  });

  it("has zh-CN strings for all starter content labels", () => {
    const zh = catalog.locales["zh-CN"];
    for (const activity of catalog.activities) {
      expect(zh[activity.labelKey]).toBeTruthy();
    }
    for (const event of catalog.events) {
      expect(zh[event.promptKey]).toBeTruthy();
      for (const choice of event.choices) {
        expect(zh[choice.labelKey]).toBeTruthy();
      }
    }
  });

  it("tracks generated locale labels required by the domain", () => {
    expect(requiredGeneratedLocaleKeys).toEqual([
      "log.birth",
      "log.age_up",
      "log.choice_resolved",
      "log.activity",
      "death.summary"
    ]);
  });

  it.each(requiredGeneratedLocaleKeys)("rejects missing generated locale label %s", (messageKey) => {
    const invalid = cloneCatalog();
    delete invalid.locales["zh-CN"][messageKey];

    expect(() => validateCatalog(invalid)).toThrow(`Missing zh-CN locale keys: ${messageKey}`);
  });

  it("rejects duplicate top-level content IDs", () => {
    const invalid = cloneCatalog();
    invalid.activities[1] = { ...invalid.activities[1], id: invalid.activities[0].id };

    expect(() => validateCatalog(invalid)).toThrow(/Duplicate activity id: study/);
  });

  it("rejects duplicate event choice IDs within an event", () => {
    const invalid = cloneCatalog();
    invalid.events[0].choices[1] = {
      ...invalid.events[0].choices[1],
      id: invalid.events[0].choices[0].id
    };

    expect(() => validateCatalog(invalid)).toThrow(/Duplicate choice id in event family_picnic: join/);
  });

  it("rejects unknown disease references in effects", () => {
    const invalid = cloneCatalog();
    invalid.events[0].choices[0].effects[0] = {
      ...invalid.events[0].choices[0].effects[0],
      addDiseaseId: "missing_disease"
    };

    expect(() => validateCatalog(invalid)).toThrow(/Unknown disease id in event family_picnic choice join: missing_disease/);
  });

  it("rejects missing en-US country labels", () => {
    const invalid = cloneCatalog();
    delete invalid.locales["en-US"]["country.us"];

    expect(() => validateCatalog(invalid)).toThrow(/Missing en-US country locale keys: country\.us/);
  });
});
