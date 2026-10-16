# Proposal

## Why

The project needs a programmatic way to query faction and unit data for external consumers (e.g. a Rust-based simulation engine). Currently, all data access goes through the PWA's client-side Supabase queries or the backup export (which downloads a file via the browser). There is no HTTP API that returns structured JSON for a faction or individual unit.

## What Changes

- Add Supabase Edge Functions that expose read-only query endpoints for faction and unit data.
- Introduce a `UnitFull` response type that groups all unit data (catalog info, base data, structured abilities, loadout) into a single object — no client-side joins needed.
- Three endpoints under a single Edge Function with path routing:
  - `GET /factions` — list all factions with unit counts.
  - `GET /factions/:factionSlug` — full faction data: units as `UnitFull[]` + detachments.
  - `GET /factions/:factionSlug/units/:unitSlug` — single unit as `UnitFull`.
- API spec document already drafted at `docs/api-spec.md`.

## Capabilities

### New Capabilities
- `query-api`: Read-only HTTP API (Supabase Edge Functions) for querying faction, unit, and detachment data. Covers endpoints, response shapes (`UnitFull`, `FactionSummary`), authentication, and error handling.

### Modified Capabilities
_(none — existing specs are unchanged; the API reads the same Supabase tables defined in `supabase-data-layer` but adds no new tables or write semantics)_

## Impact

- **New directory**: `supabase/functions/` with Edge Function source (Deno/TypeScript).
- **New dependency**: Supabase CLI for local development and deployment of Edge Functions.
- **Database**: No schema changes — reads existing `factions`, `units`, `base_data`, `unit_data`, `loadout_data`, `detachment_data` tables.
- **Auth**: Endpoints require the Supabase anon key in the `Authorization` header (same key the PWA already uses).
- **External consumers**: A Rust module (or any HTTP client) can query the API using `reqwest` or equivalent, deserializing `UnitFull` into native structs via `serde`.
