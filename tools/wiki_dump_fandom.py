#!/usr/bin/env python3
"""Download BitLife Fandom wiki pages into a local reference library.

Seed pages default to: Stats, Activities.
The crawler walks internal wiki links in main namespace (article pages) and saves:
- Parsed HTML
- Wikitext
- Plain text (rough extraction)
- Metadata and a global index
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import shutil
import sys
import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import quote
from urllib.request import Request, urlopen

API_ENDPOINT = "https://bitlife-life-simulator.fandom.com/api.php"
WIKI_BASE = "https://bitlife-life-simulator.fandom.com/wiki/"
USER_AGENT = "bitlife-local-wiki-dumper/1.0 (+local reference build)"


class TextExtractor(HTMLParser):
    """Very small HTML -> text extractor for local search/reference use."""

    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str) -> None:
        text = data.strip()
        if text:
            self._parts.append(text)

    def get_text(self) -> str:
        text = "\n".join(self._parts)
        text = html.unescape(text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip() + "\n"


@dataclass
class PageDump:
    title: str
    pageid: int | None
    url: str
    categories: list[str]
    links: list[str]
    html: str
    wikitext: str


def api_get(params: dict[str, Any], retries: int = 4, backoff: float = 1.5) -> dict[str, Any]:
    query = "&".join(f"{quote(str(k))}={quote(str(v))}" for k, v in params.items())
    url = f"{API_ENDPOINT}?{query}"

    for attempt in range(1, retries + 1):
        req = Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urlopen(req, timeout=30) as resp:
                payload = resp.read().decode("utf-8", errors="replace")
                return json.loads(payload)
        except Exception as exc:  # noqa: BLE001
            if attempt == retries:
                raise RuntimeError(f"API request failed after {retries} attempts: {url}") from exc
            sleep_sec = backoff ** attempt
            print(f"Retry {attempt}/{retries} for API call, waiting {sleep_sec:.1f}s", file=sys.stderr)
            time.sleep(sleep_sec)

    raise RuntimeError("Unreachable")


def normalize_title(raw: str) -> str:
    return raw.strip().replace("_", " ")


def title_key(raw: str) -> str:
    """Canonical key for queue/visited checks across redirects and case variants."""
    return re.sub(r"\s+", " ", normalize_title(raw)).casefold()


def should_skip_title(title: str) -> bool:
    skip_prefixes = (
        "File:",
        "Category:",
        "Template:",
        "User:",
        "Help:",
        "Talk:",
        "Special:",
        "MediaWiki:",
        "Forum:",
        "Message Wall:",
        "Blog:",
        "Thread:",
        "Module:",
        "Media:",
    )
    if title.startswith(skip_prefixes):
        return True
    # Keep only article-like titles.
    return not bool(title)


def slugify(title: str) -> str:
    slug = title.strip().replace(" ", "_")
    slug = re.sub(r"[^A-Za-z0-9_.()-]", "_", slug)
    return slug[:180] or "untitled"


def fetch_links(title: str) -> list[str]:
    links: list[str] = []
    cont: dict[str, Any] = {}
    while True:
        params: dict[str, Any] = {
            "action": "query",
            "format": "json",
            "formatversion": 2,
            "prop": "links",
            "titles": title,
            "pllimit": "max",
            "plnamespace": 0,
            "redirects": 1,
        }
        params.update(cont)

        data = api_get(params)
        pages = data.get("query", {}).get("pages", [])
        if pages:
            for item in pages[0].get("links", []) or []:
                t = normalize_title(item.get("title", ""))
                if not should_skip_title(t):
                    links.append(t)

        if "continue" not in data:
            break
        cont = data["continue"]

    # Stable ordering and dedupe.
    return sorted(set(links), key=str.casefold)


def fetch_all_page_titles() -> list[str]:
    """Return every main-namespace page title exposed by the wiki API."""
    titles: list[str] = []
    cont: dict[str, Any] = {}
    while True:
        params: dict[str, Any] = {
            "action": "query",
            "format": "json",
            "formatversion": 2,
            "list": "allpages",
            "apnamespace": 0,
            "aplimit": "max",
        }
        params.update(cont)

        data = api_get(params)
        for item in data.get("query", {}).get("allpages", []) or []:
            title = normalize_title(item.get("title", ""))
            if not should_skip_title(title):
                titles.append(title)

        if "continue" not in data:
            break
        cont = data["continue"]

    return sorted(set(titles), key=str.casefold)


def fetch_page_dump(title: str) -> PageDump:
    data = api_get(
        {
            "action": "parse",
            "format": "json",
            "formatversion": 2,
            "page": title,
            "prop": "text|wikitext|categories|links",
            "redirects": 1,
        }
    )

    parsed = data.get("parse")
    if not parsed:
        raise RuntimeError(f"No parse payload for title: {title}")

    resolved_title = normalize_title(parsed.get("title", title))
    categories = [
        c.get("category", "")
        for c in (parsed.get("categories") or [])
        if c.get("category")
    ]
    links = [
        normalize_title(item.get("title", ""))
        for item in (parsed.get("links") or [])
        if item.get("ns") == 0 and item.get("title")
    ]

    return PageDump(
        title=resolved_title,
        pageid=parsed.get("pageid"),
        url=WIKI_BASE + quote(resolved_title.replace(" ", "_"), safe="_()"),
        categories=sorted(categories, key=str.casefold),
        links=sorted(set(links), key=str.casefold),
        html=parsed.get("text", ""),
        wikitext=parsed.get("wikitext", ""),
    )


def write_page(out_dir: Path, page: PageDump, fetched_at: str) -> dict[str, Any]:
    page_dir = out_dir / "pages" / slugify(page.title)
    page_dir.mkdir(parents=True, exist_ok=True)

    (page_dir / "content.html").write_text(page.html, encoding="utf-8")
    (page_dir / "content.wikitext").write_text(page.wikitext, encoding="utf-8")

    extractor = TextExtractor()
    extractor.feed(page.html)
    (page_dir / "content.txt").write_text(extractor.get_text(), encoding="utf-8")

    meta = {
        "title": page.title,
        "pageid": page.pageid,
        "url": page.url,
        "categories": page.categories,
        "links": page.links,
        "fetched_at": fetched_at,
        "source": "bitlife-life-simulator.fandom.com/api.php",
        "files": {
            "html": str((page_dir / "content.html").relative_to(out_dir)),
            "wikitext": str((page_dir / "content.wikitext").relative_to(out_dir)),
            "text": str((page_dir / "content.txt").relative_to(out_dir)),
        },
    }

    (page_dir / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return meta


def clean_output(out_dir: Path) -> None:
    """Remove generated dataset files while leaving the parent directory in place."""
    for name in ("pages", "index.json", "index.csv", "failures.json"):
        target = out_dir / name
        if target.is_dir():
            shutil.rmtree(target)
        elif target.exists():
            target.unlink()


def crawl(
    seeds: list[str],
    out_dir: Path,
    max_pages: int,
    delay_sec: float,
    all_pages: bool = False,
    clean: bool = False,
) -> None:
    if clean:
        clean_output(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    requested_seeds = list(seeds)
    discovered_page_count: int | None = None
    if all_pages:
        seeds = fetch_all_page_titles()
        discovered_page_count = len(seeds)
        print(f"Discovered {len(seeds)} main-namespace pages from allpages API", flush=True)

    queue = deque(normalize_title(s) for s in seeds)
    queued = {title_key(s) for s in queue}
    visited: set[str] = set()
    index: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []

    fetched_at = datetime.now(timezone.utc).isoformat()

    while queue and len(index) < max_pages:
        title = queue.popleft()
        raw_key = title_key(title)
        queued.discard(raw_key)

        if raw_key in visited or should_skip_title(title):
            continue

        print(f"[{len(index)+1}/{max_pages}] Fetching: {title}", flush=True)
        try:
            page = fetch_page_dump(title)
        except Exception as exc:  # noqa: BLE001
            print(f"  ! Failed: {title} -> {exc}", file=sys.stderr, flush=True)
            visited.add(raw_key)
            failures.append({"title": title, "error": str(exc)})
            continue

        resolved_key = title_key(page.title)
        if resolved_key in visited:
            visited.add(raw_key)
            continue

        visited.add(raw_key)
        visited.add(resolved_key)
        meta = write_page(out_dir, page, fetched_at)
        index.append(meta)

        if not all_pages:
            for nxt in page.links:
                nxt_key = title_key(nxt)
                if nxt_key not in visited and nxt_key not in queued and not should_skip_title(nxt):
                    queue.append(nxt)
                    queued.add(nxt_key)

        time.sleep(delay_sec)

    # Write global indexes.
    index.sort(key=lambda x: x["title"].casefold())

    (out_dir / "index.json").write_text(
        json.dumps(
            {
                "generated_at": fetched_at,
                "seed_pages": requested_seeds,
                "discovered_page_count": discovered_page_count,
                "total_pages": len(index),
                "max_pages": max_pages,
                "all_pages": all_pages,
                "failure_count": len(failures),
                "items": index,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    with (out_dir / "index.csv").open("w", encoding="utf-8", newline="") as fp:
        writer = csv.DictWriter(
            fp,
            fieldnames=["title", "pageid", "url", "category_count", "link_count", "text_file"],
        )
        writer.writeheader()
        for item in index:
            writer.writerow(
                {
                    "title": item["title"],
                    "pageid": item.get("pageid"),
                    "url": item["url"],
                    "category_count": len(item.get("categories", [])),
                    "link_count": len(item.get("links", [])),
                    "text_file": item["files"]["text"],
                }
            )

    if failures:
        (out_dir / "failures.json").write_text(
            json.dumps(
                {
                    "generated_at": fetched_at,
                    "failure_count": len(failures),
                    "items": failures,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    print(f"Completed. Saved {len(index)} pages to: {out_dir}", flush=True)
    if failures:
        print(f"Completed with {len(failures)} failed pages. See: {out_dir / 'failures.json'}", flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download BitLife Fandom wiki references")
    parser.add_argument(
        "--out-dir",
        default="data/wiki_reference",
        help="Output directory relative to current working directory",
    )
    parser.add_argument(
        "--seed",
        action="append",
        default=None,
        help="Seed page title, can be passed multiple times",
    )
    parser.add_argument(
        "--all-pages",
        action="store_true",
        help="Download every main-namespace page from the wiki allpages API instead of link crawling from seeds",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Remove the previous generated pages/indexes in the output directory before downloading",
    )
    parser.add_argument("--max-pages", type=int, default=500, help="Safety cap for total pages")
    parser.add_argument("--delay", type=float, default=0.2, help="Delay between page fetches (seconds)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    out_dir = Path(args.out_dir)
    seeds = args.seed or ["Stats", "Activities"]
    crawl(seeds, out_dir, args.max_pages, args.delay, all_pages=args.all_pages, clean=args.clean)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
