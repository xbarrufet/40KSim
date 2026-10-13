# Proposal

## Why

Space Marines subfactions (Imperial Fists, Blood Angels, etc.) share most units with the parent "Space Marines" faction. Currently, subfactions have `units.json` but no BaseData, abilities, or loadout data. Processing abilities and loadout for 69 shared units per subfaction would be redundant — the data is identical. Only the unique units (e.g., Tor Garadon for Imperial Fists, Commander Dante for Blood Angels) need their own BaseData, abilities, and loadout processing.

## What Changes

- **`fetch_datasheets.py` gets `--skip-parent <parent-slug>` flag**: When provided, the scraper skips units whose slug already has a BaseData file in the parent faction's directory. For Imperial Fists with `--skip-parent space-marines`, only Tor Garadon and Darnath Lysander are scraped.
- **`auto_structure.py` and `auto_loadout.py` already work**: They process whatever BaseData files exist in the faction's directory — no changes needed.
- **`seed_supabase.py` already works**: It reads from the faction's own data directory — no changes needed.
- **Process Unit UI filters by own BaseData**: The unit list in a subfaction only shows units that have BaseData in Supabase under that faction's slug. Shared units (with BaseData under `space-marines`) don't appear as pending.

## Capabilities

### New Capabilities
- `subfaction-data-pipeline`: Covers the parent-aware scraping flag and the convention that subfactions only store BaseData/abilities/loadout for their unique units, inheriting shared unit data from the parent faction.

### Modified Capabilities
_(none — existing scraper, AI scripts, and seed already handle per-faction directories)_

## Impact

- **Data pipeline**: One new flag on `fetch_datasheets.py`. No changes to AI scripts or seed.
- **App code**: No changes — the UI already only shows units that have data in Supabase.
- **Convention**: Subfaction directories contain only unique unit data. Shared units are resolved from the parent.
