#!/usr/bin/env python3
"""Search and inspect curated animation/video prompts from data/videos.json."""

from __future__ import annotations

import argparse
import collections
import json
import pathlib
import sys
from typing import Any

SKILL_ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA_FILE = SKILL_ROOT / "data" / "videos.json"
PROMPTS_DIR = SKILL_ROOT / "prompts"


def load_entries() -> list[dict[str, Any]]:
    """Load prompt catalog entries from data/videos.json."""
    if not DATA_FILE.is_file():
        raise FileNotFoundError(f"Catalog not found: {DATA_FILE}")
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def parse_tags(raw_tags: list[str] | None) -> list[str]:
    """Normalize repeatable and comma-separated tag flags into lowercase tokens."""
    if not raw_tags:
        return []
    tokens: list[str] = []
    for item in raw_tags:
        for part in item.split(","):
            cleaned = part.strip().lower()
            if cleaned:
                tokens.append(cleaned)
    return tokens


def matches_entry(
    entry: dict[str, Any],
    category: str | None,
    tags: list[str],
    query_terms: list[str],
    full_only: bool,
    remake_only: bool,
) -> bool:
    """Return True when an entry satisfies all active filter criteria."""
    if category and (entry.get("category") or "").lower() != category:
        return False
    if full_only and entry.get("prompt_partial", False):
        return False
    if remake_only and not entry.get("has_remake", False):
        return False

    entry_tags = {t.lower() for t in entry.get("tech_tags") or []}
    if tags and not all(tag in entry_tags for tag in tags):
        return False

    if query_terms:
        haystack = " ".join(
            [
                str(entry.get("slug") or ""),
                str(entry.get("author") or ""),
                str(entry.get("category") or ""),
                " ".join(entry.get("tech_tags") or []),
                str(entry.get("prompt") or ""),
            ]
        ).lower()
        if not all(term in haystack for term in query_terms):
            return False

    return True


def print_stats(entries: list[dict[str, Any]]) -> None:
    """Print catalog counts grouped by category, tag, completeness, and remakes."""
    categories = collections.Counter(e.get("category", "unknown") for e in entries)
    tags = collections.Counter(t for e in entries for t in (e.get("tech_tags") or []))
    full_count = sum(1 for e in entries if not e.get("prompt_partial", False))
    remake_count = sum(1 for e in entries if e.get("has_remake", False))

    print(f"Total entries: {len(entries)} (full prompts: {full_count}, partial: {len(entries) - full_count}, remakes: {remake_count})")
    print("\nCategories:")
    for name, count in categories.most_common():
        print(f"  {name:14s} {count}")
    print("\nTech tags:")
    for name, count in tags.most_common():
        print(f"  {name:14s} {count}")


def print_entry_detail(entries: list[dict[str, Any]], slug: str) -> int:
    """Print full metadata and prompt text for a given slug."""
    target = next((e for e in entries if e.get("slug") == slug), None)
    if target is None:
        print(f"Error: slug '{slug}' not found in {DATA_FILE}", file=sys.stderr)
        return 1

    tags = ", ".join(target.get("tech_tags") or []) or "-"
    md_path = PROMPTS_DIR / f"{slug}.md"
    print(f"Slug:     {slug}")
    print(f"Author:   {target.get('author', '-')} ({target.get('author_url', '-')})")
    print(f"Category: {target.get('category', '-')} | Tags: {tags}")
    print(f"Added:    {target.get('added', '-')} | Partial: {bool(target.get('prompt_partial'))} | Remake: {bool(target.get('has_remake'))}")
    print(f"Post:     {target.get('post_url', '-')}")
    if target.get("skillry_url"):
        print(f"Skillry:  {target['skillry_url']}")
    if md_path.is_file():
        print(f"Markdown: {md_path}")
    print("\n--- PROMPT ---\n")
    print(target.get("prompt", ""))
    return 0


def format_preview(text: str, max_len: int = 130) -> str:
    """Collapse whitespace and truncate prompt text for single-line search summaries."""
    compact = " ".join(text.split())
    if len(compact) <= max_len:
        return compact
    return compact[: max_len - 3].rstrip() + "..."


def print_search_results(results: list[dict[str, Any]], limit: int) -> None:
    """Print a concise table of matching entries."""
    shown = results if limit <= 0 else results[:limit]
    print(f"Found {len(results)} matching entries (showing {len(shown)}):\n")
    for entry in shown:
        slug = entry.get("slug", "-")
        cat = entry.get("category", "-")
        tags = ",".join(entry.get("tech_tags") or []) or "-"
        kind = "partial" if entry.get("prompt_partial") else "full"
        plen = len(entry.get("prompt") or "")
        preview = format_preview(entry.get("prompt") or "")
        print(f"- {slug} [{cat} | {tags} | {kind}, {plen} chars]")
        print(f"  {preview}")


def build_parser() -> argparse.ArgumentParser:
    """Build CLI argument parser."""
    parser = argparse.ArgumentParser(
        description="Search and inspect the Awesome Opus 5.5 Videos prompt catalog."
    )
    parser.add_argument("--stats", action="store_true", help="Show catalog statistics")
    parser.add_argument("--show", metavar="SLUG", help="Show full prompt and metadata for SLUG")
    parser.add_argument("-c", "--category", help="Filter by category (motion, explainer, 3d, interactive)")
    parser.add_argument("-t", "--tag", action="append", help="Filter by tech tag (repeatable or comma-separated)")
    parser.add_argument("-q", "--query", help="Space-separated keywords to match")
    parser.add_argument("--full-only", action="store_true", help="Exclude partial prompts")
    parser.add_argument("--remake-only", action="store_true", help="Only entries with a Skillry remake")
    parser.add_argument("--sort", choices=("default", "length", "added"), default="default", help="Sort order")
    parser.add_argument("-n", "--limit", type=int, default=15, help="Max results to print (0 for all)")
    return parser


def main() -> int:
    """CLI entry point."""
    parser = build_parser()
    args = parser.parse_args()

    try:
        entries = load_entries()
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        print(f"Error loading catalog: {exc}", file=sys.stderr)
        return 1

    if args.stats:
        print_stats(entries)
        return 0

    if args.show:
        return print_entry_detail(entries, args.show)

    category = args.category.strip().lower() if args.category else None
    valid_categories = {str(e.get("category", "")).lower() for e in entries}
    if category and category not in valid_categories:
        opts = ", ".join(sorted(c for c in valid_categories if c))
        print(f"Error: unknown category '{category}'. Choose from: {opts}", file=sys.stderr)
        return 1

    tags = parse_tags(args.tag)
    query_terms = [t.lower() for t in (args.query or "").split() if t.strip()]

    results = [
        e
        for e in entries
        if matches_entry(e, category, tags, query_terms, args.full_only, args.remake_only)
    ]

    if args.sort == "length":
        results.sort(key=lambda e: len(e.get("prompt") or ""), reverse=True)
    elif args.sort == "added":
        results.sort(key=lambda e: str(e.get("added") or ""), reverse=True)

    print_search_results(results, args.limit)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
