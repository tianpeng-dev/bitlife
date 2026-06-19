# BitLife Wiki Reference Library

This folder stores a local reference dataset pulled from the BitLife Fandom wiki API.

## Crawl modes
- Default seed crawl: starts from `Stats` and `Activities`, then follows article links.
- Full wiki crawl: `--all-pages` enumerates every main-namespace page exposed by the MediaWiki `allpages` API.

## What is saved for each page
- `pages/<slug>/content.html` - parsed HTML from wiki API (`action=parse`)
- `pages/<slug>/content.wikitext` - raw wikitext
- `pages/<slug>/content.txt` - extracted plain text for quick search
- `pages/<slug>/meta.json` - page metadata, links, categories, source URL

## Global indexes
- `index.json` - all page metadata in one file
- `index.csv` - flat summary for spreadsheet filtering

## Current snapshot
- Total saved pages: 1520
- Full wiki discovery count: 1644 main-namespace titles
- Failed parse payloads: 5 entries, recorded in `failures.json`
- Empty extracted text files: 11 API-visible pages whose parsed HTML contains no readable article text

## Refresh command
From repository root:

```bash
python3 tools/wiki_dump_fandom.py --out-dir data/wiki_reference --all-pages --clean --max-pages 3000 --delay 0.05
```

Notes:
- Direct page scraping is Cloudflare-protected; this dataset uses MediaWiki API endpoints.
- `--clean` removes the previous generated pages and indexes before rebuilding.
- Omit `--all-pages` to run the smaller link crawl from the default seed pages.
