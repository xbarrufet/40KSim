# Design

## Context

See proposal.md — Why. The scraped data in `data/` has 36 factions with 1,729 units but the seed file is empty. A build script is needed to bridge the gap.

The scraped per-unit data has: `name`, `slug`, `category`, `url`, `points` (as string or null). The `UnitCatalog` TypeScript interface expects `UnitProfile` with required arrays (`keywords`, `models`, `weapons`, `abilities`) that only exist in the full BaseData (downloaded by `fetch_datasheets.py`), not in the basic unit listing.

## Goals / Non-Goals

**Goals:**
- Create a build script that produces a valid seed file from scraped data
- Make the TypeScript interfaces tolerant of units without full datasheet data
- Generate and commit a populated seed file

**Non-Goals:**
- Including BaseData (models, weapons, abilities) in the seed — that data is uploaded per-unit via the upload modal
- Modifying the scraper scripts themselves

## Decisions

### 1. Make `UnitProfile` arrays optional

**Choice**: Change `keywords`, `models`, `weapons`, `abilities` from required to optional (`?`) in `UnitProfile`.

**Why**: The seed file only needs enough data for the faction browser (name, slug, points, category). Full datasheet data arrives later via BaseData upload. Making these optional avoids generating empty arrays for 1,729 units and accurately reflects the data lifecycle: units exist in the catalog before their datasheets are loaded.

**Impact**: `GameView.tsx` already accesses `models[0]` — currently inert (empty units array), but if wired up later it would need optional chaining. The `seedFromCatalog` function in `db.ts` reads `unit.keywords` — needs a `?? []` fallback.

### 2. Script reads factions.json categories

**Choice**: The build script reads `data/factions.json` (keyed by category) to get both the faction list and the category grouping. For each faction, it reads `data/<slug>/units.json` to get the unit list.

**Why**: `factions.json` is the canonical source of categories (Imperium, Space Marines, Chaos, Xenos). The per-faction `units.json` has the unit-level categories (Leaders & Characters, etc.).

### 3. Points stored as number or undefined

**Choice**: The scraped `points` field is a string (`"40"`) or null. The build script converts it to `number | undefined` to match the `UnitProfile.points` type.
