# Design

## Context

See proposal.md — Why. The seed file should only bootstrap factions into IndexedDB. Units are created by uploading BaseData files. Faction cards need data counters to show upload progress.

Current state after `faction-unit-browser` implementation:
- `db.ts`: 4 IndexedDB stores, `seedFromCatalog` seeds both factions and units
- `FactionsView.tsx`: faction cards show name + unit count
- `UploadModal.tsx`: matches files to existing units, prompts create-or-skip for unmatched
- `schema.ts`: `Faction` has no `icon` field, `UnitProfile` arrays are required

## Goals / Non-Goals

**Goals:**
- Create `data/build_seed.py` to produce a factions-only seed file
- Add `icon` field to faction data
- Show BaseData/UnitData counters on faction cards
- Simplify upload modal — auto-create units, no create/skip prompt
- Make `UnitProfile` arrays optional (units created from BaseData may lack them)

**Non-Goals:**
- Actual icon SVG files (placeholder paths for now)
- Processing BaseData into UnitData (future spec)

## Decisions

### 1. Seed file format: factions with empty units arrays

**Choice**: Keep the `UnitCatalog` shape (`schemaVersion`, `factions[]` with `units[]`) but each faction has `units: []`. This maintains backward compatibility with the TypeScript interface.

**Why**: The schema validation in `loadCatalog.ts` checks `schemaVersion === 1 && Array.isArray(factions)`. Keeping the shape means no loader changes. Empty `units` array is valid — `seedFromCatalog` just won't write any unit records.

### 2. Faction counters: async count from IndexedDB

**Choice**: Add `getBaseDataCount(factionSlug)` and `getUnitDataCount(factionSlug)` helpers to `db.ts` that iterate the respective stores counting keys starting with `<factionSlug>/`. `FactionsView` calls these per faction and renders the counts.

**Why**: The counts must reflect the live state (uploads change them). A cursor prefix scan is the simplest approach without adding indexes.

### 3. Upload auto-creates units

**Choice**: Remove the create/skip toggle from `UploadModal`. On confirm, every file gets its unit auto-created if it doesn't exist, then baseData is stored. The modal just shows the file list with matched/new labels.

**Why**: The user confirmed this is the desired flow — uploading BaseData for a faction should populate everything in one step.

### 4. Faction icon field

**Choice**: Add `icon?: string` to the `Faction` interface and the IndexedDB `FactionRecord`. The seed file sets it to `/icons/<slug>-icon.svg`. `FactionsView` renders an `<img>` with an `onError` handler that hides it.

**Why**: Optional because the icon files don't exist yet — the app must handle missing icons gracefully.
