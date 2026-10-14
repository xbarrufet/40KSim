# Proposal

## Why

The simulator currently models units, abilities, and loadout but has no concept of detachments — the army-building layer that provides a detachment rule, enhancements, and stratagems. Detachment enhancements modify unit stats and weapon keywords in the same way abilities do, so structuring them is a prerequisite for accurate simulation of army-level buffs. The raw detachment data is already being scraped by `fetch_faction_data.py` but only for Space Marines and is not stored in Supabase or surfaced in the app.

## What Changes

- **Run the existing scraper for all factions** to populate `faction_data.json` across the board.
- **New AI structuring script** (`auto_structure_enhancements.py`) that converts enhancement rules text into the existing `Effect[]` type system, following the same pattern as `auto_structure.py` for unit abilities.
- **New Supabase table** (`detachment_data`) storing raw scraped detachment data alongside structured enhancements, with a tag-based review workflow (SCRAPED → AI_PROPOSED → CONFIRMED).
- **New TypeScript types** for detachments and structured enhancements, reusing the existing `Effect` union.
- **Supabase client functions** for fetching and upserting detachment data.
- **Seed script extension** to upload detachment data from local files to Supabase.
- **New UI view** for browsing detachments per faction and reviewing/editing structured enhancements.
- **Backup format extension** to include detachment data in faction backup export/import.

## Capabilities

### New Capabilities
- `detachment-data-pipeline`: Covers the detachment data model, AI structuring of enhancements into `Effect[]`, Supabase storage, seed script, and the review/edit UI for detachment enhancements. Detachment rules and stratagems are stored as raw text; only enhancements are structured.

### Modified Capabilities
- `supabase-data-layer`: Adding the `detachment_data` table and corresponding client functions.
- `faction-backup`: Extending the backup JSON format and export/import logic to include detachment data.

## Impact

- **Python scripts**: `seed_supabase.py` gains detachment seeding; new `auto_structure_enhancements.py` script.
- **Supabase**: New `detachment_data` table (migration needed).
- **TypeScript**: New types in `schema.ts`, new functions in `supabase.ts`, new backup fields in `backup.ts`.
- **UI**: New detachment browsing/review view accessible from faction detail.
- **Backup format**: Version bump or additive field — existing backups without `detachmentData` remain valid (empty array default).
