# Proposal

## Why

Space Marines subfactions (Imperial Fists, Blood Angels, etc.) share most units with the parent "Space Marines" faction. When opening a subfaction, shared units appear as red (unprocessed) because their `unit_data` and `loadout_data` records are stored under `space-marines`, not under the subfaction's slug. The abilities and loadout for shared units (Captain, Intercessors, etc.) are identical across all subfactions and should not need re-processing per subfaction.

## What Changes

- **Static parent-faction map**: A `PARENT_FACTION` constant mapping 11 SM subfactions to `space-marines` (Grey Knights excluded — it has its own near-complete roster).
- **Inherited status resolution**: `getUnitStatuses` falls back to the parent faction's `unit_data` for units that have no record under the subfaction's slug.
- **Inherited data reads**: `getStructuredAbilitiesData` and `getLoadoutData` fall back to the parent faction when the subfaction has no record.
- **Inherited data reads for BaseData**: `getBaseData` falls back to the parent faction for shared units.
- **Writes target the owning faction**: When saving abilities or loadout for a shared unit opened from a subfaction, the write goes to the parent faction's slug (e.g., `space-marines`), so all subfactions see the update.

## Capabilities

### New Capabilities
- `subfaction-inheritance`: Covers the parent-faction map, fallback data resolution for reads, and parent-targeted writes for shared units.

### Modified Capabilities
_(none — existing read/write functions gain fallback logic, no behavioral spec changes for the existing process-unit or supabase-data-layer capabilities)_

## Impact

- **App code**: Changes to `db.ts` (fallback logic in read functions), `ProcessUnitView.tsx` (resolve correct faction slug for saves), and a new constant map.
- **No Supabase changes**: Same tables, same queries — just querying the parent slug as fallback.
- **No data migration**: Existing data stays where it is.
