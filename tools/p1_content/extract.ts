export interface ReferenceOutline {
  headings: string[];
  items: string[];
}

export function extractReferenceOutline(text: string): ReferenceOutline {
  const headings: string[] = [];
  const items: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const headingMatch = line.match(/^=+\s*(.+?)\s*=+$/);
    if (headingMatch) {
      headings.push(headingMatch[1].trim());
      continue;
    }

    const listMatch = line.match(/^[*#-]+\s*(.+)$/);
    if (listMatch) {
      items.push(listMatch[1].replace(/\[\[|\]\]/g, "").trim());
    }
  }

  return { headings, items };
}
