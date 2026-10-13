# Proposal

## Why

Unit loadout options (wargear replacement rules) exist only as free-text strings in BaseData's `wargearRules` field. The simulator needs structured, validated loadout data to generate legal weapon combinations for a unit. Without it, users must manually interpret text rules every time they build a list, and the app cannot validate or auto-generate loadout combinations.

## What Changes

- **New Python script `auto_loadout.py`**: Reads each unit's `wargearRules` (text) and `wargear` (array with IDs), sends them to Claude API to produce structured `WargearOption[]` proposals, and writes `loadout_proposals.json` per faction.
- **New Supabase table `loadout_data`**: Stores structured loadout proposals per unit with `faction_slug`, `unit_slug`, `tag` (AI_PROPOSED / PENDING / CONFIRMED), and `options` (JSONB).
- **Extend `seed_supabase.py`**: Upload `loadout_proposals.json` into the new `loadout_data` table.
- **Extend Supabase client (`supabase.ts`)**: Add fetch/upsert functions for `loadout_data`.
- **New "Loadout Options" section in Process Unit screen**: Displays each wargear rule's original text alongside the AI-proposed structured version. User can approve or reject each rule individually. Saving writes the confirmed loadout data to Supabase with tag CONFIRMED.
- **New TypeScript interfaces**: `StructuredLoadoutData`, `WargearOption`, `WargearChoice`, `WargearScope`, `WargearRef` in the data schema.

## Capabilities

### New Capabilities
- `structured-loadout`: Covers the structured loadout data format (WargearOption schema), the AI structuring pipeline (auto_loadout.py), and the approve/reject review flow on the Process Unit screen for wargear rules.

### Modified Capabilities
- `supabase-data-layer`: New `loadout_data` table added to the Supabase schema, with corresponding client functions and Supabase-first write semantics.
- `process-unit`: New "Loadout Options" section added to the Process Unit screen for reviewing and confirming AI-proposed loadout structures.

## Impact

- **Data pipeline**: New `auto_loadout.py` script and extension of `seed_supabase.py`. Same Anthropic SDK dependency as `auto_structure.py`.
- **Supabase**: New `loadout_data` table (DDL required). No changes to existing tables.
- **App code**: New section in Process Unit view, new interfaces in `schema.ts`, new functions in `supabase.ts` and `db.ts`.
- **No breaking changes**: Existing abilities workflow is untouched. Loadout review is additive.
