# Proposal

## Why

The app's seed file (`app/public/data/units.json`) is empty — `{"schemaVersion": 1, "factions": []}`. The locally scraped data in `data/` has all 36 factions with 1,729 units total, each with slug, name, category, and points. Without a populated seed file, the FACTIONS tab shows nothing on first launch.

## What Changes

- **Create `data/build_seed.py`**: A Python script that reads `data/factions.json` and each `data/<slug>/units.json` to produce `app/public/data/units.json` in the `UnitCatalog` format.
- **Make `UnitProfile` arrays optional**: The scraped unit data only has name, slug, category, and points — no models, weapons, abilities, or keywords. These arrays must become optional in the TypeScript interface so the seed file can include units without full datasheet data.
- **Run the script** to generate a populated seed file with all 36 factions.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

_None — this is a tooling/data pipeline change. The app's seeding behavior is unchanged; only the seed file content changes from empty to populated._

## Impact

- **TypeScript interfaces**: `UnitProfile` in `schema.ts` — `keywords`, `models`, `weapons`, `abilities` become optional (`?`).
- **New file**: `data/build_seed.py` (Python 3, no extra dependencies beyond stdlib).
- **Modified file**: `app/public/data/units.json` (populated with ~36 factions, ~1,729 units).
- **IndexedDB seeding**: `db.ts`'s `seedFromCatalog` may need to handle missing optional arrays when unpacking units.
