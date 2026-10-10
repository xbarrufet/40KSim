# Spec Delta

## MODIFIED Requirements

### Requirement: Seed file contains factions only
The seed file (`/data/units.json`) is no longer required for normal operation. On first launch, the app SHALL fetch faction data from Supabase instead of from a static JSON file. The seed file MAY be retained in the repository but SHALL NOT be fetched or used at runtime when Supabase is available.

#### Scenario: First launch with Supabase
- **WHEN** the app starts with an empty IndexedDB and Supabase is reachable
- **THEN** it SHALL fetch factions from Supabase
- **AND** it SHALL NOT attempt to fetch `/data/units.json`

#### Scenario: First launch without Supabase and no env vars
- **WHEN** the app starts with an empty IndexedDB in offline/fallback mode (no Supabase env vars)
- **THEN** it SHALL fall back to fetching `/data/units.json` as before

## ADDED Requirements

### Requirement: BaseData Upload Writes to Supabase
When the user uploads BaseData JSON files via the upload modal, the data SHALL be written to Supabase first, then cached in IndexedDB. The upload flow SHALL create or update the unit record and the base_data record in Supabase.

#### Scenario: Upload BaseData with Supabase available
- **WHEN** the user uploads BaseData files for units in a faction
- **THEN** for each file, the unit record and base_data record SHALL be upserted in Supabase
- **AND** the same data SHALL be cached in IndexedDB

#### Scenario: Upload BaseData with Supabase unavailable
- **WHEN** the user uploads BaseData files but Supabase is unreachable
- **THEN** the upload SHALL fail with an error message

### Requirement: AI Proposals Import Writes to Supabase
When the user imports an AI proposals JSON file, the created or updated StructuredAbilitiesData records SHALL be written to Supabase first, then cached in IndexedDB.

#### Scenario: Import proposals with Supabase available
- **WHEN** the user imports a proposals file
- **THEN** matching unit_data records SHALL be upserted in Supabase
- **AND** the same data SHALL be cached in IndexedDB
