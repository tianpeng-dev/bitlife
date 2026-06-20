import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractReferenceOutline } from "./extract";
import { p1ReferencePages } from "./referencePages";

interface CoverageManifest {
  generatedAt: string;
  pages: Array<{ page: string; headings: string[]; itemCount: number }>;
}

function pagePath(root: string, page: string): string {
  return join(root, "data", "wiki_reference", "pages", page, "content.wikitext");
}

const generatorDirectory = dirname(fileURLToPath(import.meta.url));
const derivedProjectRoot = resolve(generatorDirectory, "../..");

export function buildCoverageManifest(root = derivedProjectRoot): CoverageManifest {
  return {
    generatedAt: new Date(0).toISOString(),
    pages: p1ReferencePages.map((page) => {
      const text = readFileSync(pagePath(root, page), "utf8");
      const outline = extractReferenceOutline(text);
      return { page, headings: outline.headings, itemCount: outline.items.length };
    }),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifest = buildCoverageManifest(derivedProjectRoot);
  writeFileSync(
    join(derivedProjectRoot, "src", "content", "p1", "generated", "coverage.manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}
