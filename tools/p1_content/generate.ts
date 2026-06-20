import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { extractReferenceOutline } from "./extract";
import { p1ReferencePages } from "./referencePages";

interface CoverageManifest {
  generatedAt: string;
  pages: Array<{ page: string; headings: string[]; itemCount: number }>;
}

function pagePath(root: string, page: string): string {
  return join(root, "data", "wiki_reference", "pages", page, "content.wikitext");
}

export function buildCoverageManifest(root = process.cwd()): CoverageManifest {
  return {
    generatedAt: new Date(0).toISOString(),
    pages: p1ReferencePages.map((page) => {
      const text = readFileSync(pagePath(root, page), "utf8");
      const outline = extractReferenceOutline(text);
      return { page, headings: outline.headings, itemCount: outline.items.length };
    }),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifest = buildCoverageManifest();
  writeFileSync("src/content/p1/generated/coverage.manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
}
