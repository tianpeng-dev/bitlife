import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { extractReferenceOutline } from "../../tools/p1_content/extract";
import { buildCoverageManifest } from "../../tools/p1_content/generate";
import { p1ReferencePages } from "../../tools/p1_content/referencePages";
import { scanForbiddenSimilarity } from "../../tools/p1_content/scan";

const projectRoot = process.cwd();

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

  it("extracts nested wiki list lines with optional marker spacing", () => {
    const outline = extractReferenceOutline(
      "*Thai Ridgeback\n** Divorce event\n##There is a hearing\n- Local travel\n",
    );

    expect(outline.items).toEqual(["Thai Ridgeback", "Divorce event", "There is a hearing", "Local travel"]);
  });

  it("flags forbidden visible expressions before generated content ships", () => {
    expect(scanForbiddenSimilarity("A safe generated phrase")).toEqual([]);
    expect(scanForbiddenSimilarity("This mentions BitLife Marketplace")).toContain("BitLife");
  });

  it("builds the coverage manifest from the generator location by default", () => {
    const originalCwd = process.cwd();

    try {
      process.chdir("/tmp");

      expect(buildCoverageManifest()).toEqual(buildCoverageManifest(projectRoot));
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("can be imported when process.argv[1] is undefined", () => {
    const output = execFileSync(
      join(projectRoot, "node_modules", ".bin", "tsx"),
      [
        "-e",
        "process.argv[1] = undefined; import('./tools/p1_content/generate.ts').then(() => console.log('import ok'))",
      ],
      { cwd: projectRoot, encoding: "utf8" },
    );

    expect(output.trim()).toBe("import ok");
  });
});
