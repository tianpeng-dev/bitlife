import { describe, expect, it } from "vitest";
import { extractReferenceOutline } from "../../tools/p1_content/extract";
import { p1ReferencePages } from "../../tools/p1_content/referencePages";
import { scanForbiddenSimilarity } from "../../tools/p1_content/scan";

describe("P1 content generation pipeline", () => {
  it("declares every P1 reference page used by the feature matrix", () => {
    expect(p1ReferencePages).toEqual(
      expect.arrayContaining([
        "Assets",
        "Relationships",
        "Fertility",
        "Crime",
        "Prison",
        "Lawsuit",
        "Nations",
        "Stats_Fame",
        "Social_Media",
        "Pets",
        "Emigration",
      ]),
    );
  });

  it("extracts headings and list-like lines from local text", () => {
    const outline = extractReferenceOutline("== Homes ==\n* Apartment\n* House\n== Vehicles ==\n* Car\n");

    expect(outline.headings).toEqual(["Homes", "Vehicles"]);
    expect(outline.items).toEqual(["Apartment", "House", "Car"]);
  });

  it("flags forbidden visible expressions before generated content ships", () => {
    expect(scanForbiddenSimilarity("A safe generated phrase")).toEqual([]);
    expect(scanForbiddenSimilarity("This mentions BitLife Marketplace")).toContain("BitLife");
  });
});
