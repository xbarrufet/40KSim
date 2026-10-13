# Spec Delta

## ADDED Requirements

### Requirement: Loadout Data Table

The Supabase database SHALL have a `loadout_data` table with columns: `faction_slug` (text), `unit_slug` (text), `tag` (text), `options` (JSONB). The primary key SHALL be `(faction_slug, unit_slug)`.

#### Scenario: Table schema
- **WHEN** the `loadout_data` table is queried
- **THEN** it SHALL contain columns `faction_slug`, `unit_slug`, `tag`, and `options` with `(faction_slug, unit_slug)` as the composite primary key

### Requirement: Loadout Data Client Functions

The Supabase client module SHALL provide `fetchLoadoutData(factionSlug, unitSlug)` and `upsertLoadoutData(factionSlug, unitSlug, loadoutData)` functions following the same Supabase-first write pattern as existing data functions.

#### Scenario: Fetching loadout data
- **WHEN** `fetchLoadoutData` is called with a faction and unit slug
- **THEN** it SHALL return the `loadout_data` row or null if none exists

#### Scenario: Upserting loadout data
- **WHEN** `upsertLoadoutData` is called
- **THEN** it SHALL write to Supabase first, then update IndexedDB cache on success
