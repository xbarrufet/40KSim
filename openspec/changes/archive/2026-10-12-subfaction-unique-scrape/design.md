# Design

## Context

See proposal.md for motivation. The scraper (`fetch_datasheets.py`) already skips units that have a file on disk (line 95-96). The new flag adds a second skip condition: units that exist in the parent's BaseData directory.

## Goals / Non-Goals

**Goals:**
- Scrape only unique units for subfactions, avoiding redundant downloads
- Backwards compatible — existing behavior unchanged without the flag

**Non-Goals:**
- Automatic parent detection (user provides the parent slug explicitly)
- UI changes — the app already shows only units with data in Supabase
- Changes to AI scripts or seed — they already process per-faction directories

## Decisions

### 1. Explicit `--skip-parent` flag (not automatic detection)

The user passes `--skip-parent space-marines` explicitly. No magic parent lookup from `factions.json` categories.

**Alternative**: Auto-detect parent from category grouping. Rejected — fragile assumption, Grey Knights is in the SM category but has very different unit composition. Explicit is safer.

### 2. Check parent BaseData files on disk

The skip is based on file existence in `data/<parent-slug>/BaseData/<unit-slug>.json`. Simple, fast, no API calls needed.

## Risks / Trade-offs

- **Parent must be scraped first**: If `space-marines/BaseData/` is empty, `--skip-parent space-marines` would skip nothing. This is the expected workflow order.
