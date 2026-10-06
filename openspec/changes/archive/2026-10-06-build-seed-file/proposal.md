# Proposal

## Why

The app's seed file is empty and the data model needs clarification. The seed should contain **only factions** (name, slug, icon path) — not units. Units arrive when the user uploads BaseData files via the drop zone. This simplifies the data pipeline: a Python script produces a minimal seed with the 36 factions from the local scraped data, and the app populates units as BaseData is uploaded.

Additionally, faction cards should show how much data has been loaded (BaseData / UnitData counts) so the user can track progress across factions.

## What Changes

- **Simplify seed to factions only**: The seed file (`app/public/data/units.json`) contains only factions with name, slug, and icon path. No units in the seed.
- **Add icon path to factions**: Each faction gets an icon field pointing to `/icons/<faction-slug>-icon.svg` (placeholder path for now).
- **Add BaseData/UnitData counters to faction cards**: Each faction card shows "N base / M processed" below the faction name.
- **Simplify upload to auto-create units**: Dropping BaseData files auto-creates unit entries + stores baseData in one step, no per-file confirmation needed for known files.
- **Create `data/build_seed.py`**: Reads `data/factions.json` and produces the seed file.
- **Update TypeScript interfaces**: `Faction` gains `icon` field. `UnitProfile` arrays (`keywords`, `models`, `weapons`, `abilities`) become optional since units are created from BaseData upload which may not have all fields.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `faction-unit-browser`: Faction cards add BaseData/UnitData counters. Upload modal auto-creates units on drop. Seed file contains only factions (no units). Faction data includes icon path.

## Impact

- **Seed file**: Changes from `UnitCatalog` with factions+units to factions-only.
- **TypeScript interfaces**: `Faction` gains `icon: string`, `UnitProfile` arrays become optional.
- **IndexedDB seeding**: `seedFromCatalog` simplified — only seeds `factions` store, not `units`.
- **FactionsView**: Faction cards add counter display (requires querying baseData/unitData counts).
- **UploadModal**: Simplified — auto-creates units on confirm, no per-file match/skip UI for unknown files.
- **New file**: `data/build_seed.py`.
