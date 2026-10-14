# Spec Delta

## ADDED Requirements

### Requirement: Detachment Data Table

The Supabase database SHALL have a `detachment_data` table with columns: `faction_slug` (text), `detachment_slug` (text), `tag` (text), `data` (JSONB), `enhancements` (JSONB, nullable). The primary key SHALL be `(faction_slug, detachment_slug)`.

#### Scenario: Table schema
- **WHEN** the `detachment_data` table is queried
- **THEN** it SHALL contain columns `faction_slug`, `detachment_slug`, `tag`, `data`, and `enhancements` with `(faction_slug, detachment_slug)` as the composite primary key

### Requirement: Detachment Data Client Functions

The Supabase client module SHALL provide `fetchDetachmentsByFaction(factionSlug)`, `fetchDetachmentData(factionSlug, detachmentSlug)`, `upsertDetachmentData(factionSlug, detachmentSlug, detachmentData)`, and `fetchAllDetachmentDataByFaction(factionSlug)` functions following the same Supabase-first write pattern as existing data functions.

#### Scenario: Fetching all detachments for a faction
- **WHEN** `fetchDetachmentsByFaction` is called with a faction slug
- **THEN** it SHALL return all `detachment_data` rows for that faction

#### Scenario: Upserting detachment data
- **WHEN** `upsertDetachmentData` is called
- **THEN** it SHALL write to Supabase first with `(faction_slug, detachment_slug)` as the conflict key, following the Supabase-first write pattern
