# Design

## Context

See proposal.md — Why. The `faction-unit-browser` spec was migrated from a prior format and reverse-engineering revealed gaps between the spec and the codebase. This change corrects the spec only; no application code is modified.

The key finding is that the admin panel relied on a backend API that provided slugs, but the client-side architecture (IndexedDB) needs slugs in the seed data. The scraper already works with slugs internally (file paths use `<faction-slug>/<unit-slug>.json`), but doesn't include them in the output JSON.

## Goals / Non-Goals

**Goals:**
- Correct the spec so it accurately describes the slug strategy (explicit in seed data, not derived)
- Fix the admin removal file list to include `factionDetail.css`
- Document intentional drops from the admin panel (faction-level status lights, edit/view toggle)
- Remove the redundant "No Edit/View Toggle" negative requirement

**Non-Goals:**
- Changing application code (that's the next change)
- Redesigning the IndexedDB schema — the spec's schema is sound once slugs are sourced correctly
- Adding new features beyond what the original spec intended

## Decisions

### 1. Slugs come from the scraper, not derived at runtime

**Choice**: The Python scraper includes explicit `slug` fields in `units.json`. The TypeScript `Faction` and `UnitProfile` interfaces add `slug: string`.

**Why**: The scraper already uses slugs for file paths (`data/<faction-slug>/BaseData/<unit-slug>.json`). Exposing them in the output JSON is a one-line addition per script. Deriving slugs from names at runtime (kebab-casing) is fragile — names like "C'tan Shard of the Void Dragon" produce ambiguous slugs, and the scraper's slugs are the canonical ones from 40k.app.

**Alternative considered**: Derive at seed time via `name.toLowerCase().replace(/[^a-z0-9]+/g, '-')`. Rejected because it could mismatch the scraper's slugs when uploading BaseData files (filenames use the scraper's slug).

### 2. Drop faction-level status lights

**Choice**: Faction cards show name + unit count only.

**Why**: The admin's aggregate status light (based on `baseDataCount`/`unitDataCount` ratios) required backend aggregation. In the IndexedDB model, computing this means scanning all units per faction on every render. The spec's focus is browsing — status is visible at the unit level where it's actionable.

### 3. Remove negative "No Edit/View Toggle" requirement

**Choice**: Drop this requirement from the spec.

**Why**: The spec should describe what the system does, not what it doesn't do. The absence of edit mode follows naturally from the positive requirements (unit links, upload button, status lights). Keeping a negative requirement creates maintenance burden without adding testable behavior.

## Risks / Trade-offs

- **[Spec drift]** The delta modifies the "First launch" scenario and "Admin Removal" requirement. If the main spec is later edited independently, the archive merge could conflict. → Mitigation: Apply this change promptly before other spec changes.
- **[Scraper update required]** Adding `slug` to the seed file requires updating `fetch_units.py` and `fetch_datasheets.py`. This is straightforward but is a code change deferred to the implementation change. → Mitigation: The delta spec calls this out explicitly so the implementation tasks include it.
