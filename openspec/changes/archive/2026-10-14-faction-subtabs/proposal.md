# Proposal

## Why

The faction detail view currently shows only the unit list (datasheets). Detachments are accessed via a small "DET" toolbar button, and army rules aren't displayed at all. 40k.app uses a tabbed submenu (DATASHEETS / ARMY RULES / DETACHMENTS) for faction navigation — adopting the same pattern makes the app's structure familiar to users and gives army rules and detachments proper visibility.

## What Changes

- **Replace the "DET" toolbar button** with a horizontal submenu bar below the faction header, with tabs: DATASHEETS (unit list), ARMY RULES, DETACHMENTS.
- **Add Army Rules tab** displaying the faction's army rules as formatted HTML text, sourced from Supabase.
- **Store army rules in Supabase** by adding an `army_rules` JSONB column to the existing `factions` table, populated by `seed_supabase.py` from `faction_data.json`.
- **Subfaction inheritance**: army rules from the parent faction are shown for subfactions, same as with detachments.

## Capabilities

### New Capabilities
_none_

### Modified Capabilities
- `faction-unit-browser`: Replacing the flat unit list view with a tabbed submenu (DATASHEETS / ARMY RULES / DETACHMENTS). Adding an Army Rules tab with formatted HTML content.
- `supabase-data-layer`: Adding `army_rules` JSONB column to the `factions` table and a corresponding client function.

## Impact

- **UI**: `UnitsView.tsx` gains a subtab bar and conditionally renders unit list, army rules, or detachments view. The "DET" button is removed.
- **Supabase**: `factions` table gets an `army_rules` JSONB column. No migration needed for existing rows (nullable column).
- **Python**: `seed_supabase.py` extended to populate `army_rules` from `faction_data.json`.
- **TypeScript**: `supabase.ts` gains a function to fetch army rules; `FactionRow` interface updated.
