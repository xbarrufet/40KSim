# Spec Delta

## Purpose

Shared data persistence layer using Supabase as the source of truth for faction, unit, BaseData, and StructuredAbilitiesData records, with IndexedDB as a local read cache.

## ADDED Requirements

### Requirement: Supabase Client Configuration
The app SHALL initialize a Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables. The client SHALL be a singleton shared across the application.

#### Scenario: Client initialization with valid config
- **WHEN** the app starts with both environment variables set
- **THEN** the Supabase client connects to the configured project

#### Scenario: Missing environment variables
- **WHEN** either `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing
- **THEN** the app SHALL fall back to IndexedDB-only mode without Supabase connectivity

### Requirement: Factions Table
The Supabase database SHALL have a `factions` table with columns: `slug` (text, PK), `name` (text), `category` (text, nullable), `icon` (text, nullable), `unit_count` (integer).

#### Scenario: Read all factions
- **WHEN** the app requests the faction list
- **THEN** it SHALL receive all rows from the `factions` table

#### Scenario: Write a faction
- **WHEN** a faction record is upserted
- **THEN** the row SHALL be inserted or updated by `slug`

### Requirement: Units Table
The Supabase database SHALL have a `units` table with columns: `faction_slug` (text, FK to factions), `slug` (text), `name` (text), `category` (text, nullable), `points` (integer, nullable), `keywords` (text array). The primary key SHALL be `(faction_slug, slug)`.

#### Scenario: Read units by faction
- **WHEN** the app requests units for a faction slug
- **THEN** it SHALL receive all rows where `faction_slug` matches

#### Scenario: Upsert a unit
- **WHEN** a unit record is upserted
- **THEN** the row SHALL be inserted or updated by `(faction_slug, slug)`

### Requirement: Base Data Table
The Supabase database SHALL have a `base_data` table with columns: `faction_slug` (text), `unit_slug` (text), `data` (JSONB). The primary key SHALL be `(faction_slug, unit_slug)`.

#### Scenario: Store a datasheet
- **WHEN** a BaseData JSON is uploaded for a unit
- **THEN** the full datasheet SHALL be stored as a JSONB value in `data`

#### Scenario: Retrieve a datasheet
- **WHEN** the app requests BaseData for a specific faction/unit pair
- **THEN** it SHALL receive the JSONB `data` column for that row

### Requirement: Unit Data Table
The Supabase database SHALL have a `unit_data` table with columns: `faction_slug` (text), `unit_slug` (text), `tag` (text), `abilities` (JSONB), `raw_abilities` (JSONB), `base_data_hash` (text, nullable). The primary key SHALL be `(faction_slug, unit_slug)`.

#### Scenario: Store structured abilities
- **WHEN** StructuredAbilitiesData is saved for a unit
- **THEN** the `tag`, `abilities`, `raw_abilities`, and `base_data_hash` fields SHALL be persisted

#### Scenario: Filter by tag
- **WHEN** the app queries unit_data with a tag filter
- **THEN** only rows matching the specified tag SHALL be returned

### Requirement: Supabase-First Writes
All write operations for shared data (factions, units, base_data, unit_data) SHALL write to Supabase first. After a successful Supabase write, the same data SHALL be written to IndexedDB as cache. If the Supabase write fails, the operation SHALL fail without updating IndexedDB.

#### Scenario: Successful write
- **WHEN** a shared data record is saved and Supabase accepts the write
- **THEN** the record SHALL also be written to IndexedDB
- **AND** the operation SHALL resolve successfully

#### Scenario: Supabase write failure
- **WHEN** a shared data record is saved but Supabase returns an error
- **THEN** IndexedDB SHALL NOT be updated
- **AND** the operation SHALL reject with the error

### Requirement: Stale-While-Revalidate Reads
Read operations for shared data SHALL serve data from IndexedDB immediately (if available) and trigger a background revalidation against Supabase. When Supabase returns fresher data, IndexedDB SHALL be updated silently.

#### Scenario: Cache hit with revalidation
- **WHEN** the app reads a record that exists in IndexedDB
- **THEN** it SHALL return the IndexedDB data immediately
- **AND** it SHALL fetch the current value from Supabase in the background
- **AND** if the Supabase value differs, it SHALL update IndexedDB

#### Scenario: Cache miss
- **WHEN** the app reads a record that does not exist in IndexedDB
- **THEN** it SHALL fetch from Supabase and store the result in IndexedDB before returning

#### Scenario: Offline read
- **WHEN** the app reads a record while Supabase is unreachable
- **THEN** it SHALL return the IndexedDB cached value (if any) without error

### Requirement: Initial Data Load
On first app launch (empty IndexedDB), the app SHALL fetch factions from Supabase instead of seeding from a static JSON file. The static `units.json` seed file SHALL no longer be required for normal operation.

#### Scenario: First launch with Supabase available
- **WHEN** the app starts with an empty IndexedDB and Supabase is reachable
- **THEN** it SHALL fetch all factions from Supabase and populate IndexedDB

#### Scenario: First launch without Supabase
- **WHEN** the app starts with an empty IndexedDB and Supabase is unreachable
- **THEN** it SHALL display an error indicating that data could not be loaded

### Requirement: Lists Remain Local
Army list data (the `lists` IndexedDB store) SHALL NOT be moved to Supabase. List operations SHALL continue using IndexedDB directly, with no Supabase involvement.

#### Scenario: Save an army list
- **WHEN** a user saves an army list
- **THEN** it SHALL be stored only in IndexedDB

#### Scenario: Read army lists
- **WHEN** the app loads army lists
- **THEN** it SHALL read only from IndexedDB
