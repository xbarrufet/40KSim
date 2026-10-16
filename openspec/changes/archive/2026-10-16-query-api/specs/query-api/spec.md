# Spec Delta

## Purpose

Read-only HTTP API (Supabase Edge Functions) for querying faction and unit data, enabling external consumers such as a Rust simulation engine to fetch structured game data over HTTP.

## ADDED Requirements

### Requirement: List Factions Endpoint

The system SHALL expose a `GET /factions` Edge Function endpoint that returns all factions with a unit count greater than zero.

#### Scenario: Successful faction list

- **WHEN** a client sends `GET /factions` with a valid `Authorization` header
- **THEN** the response SHALL have status 200 and a JSON body with a `factions` array of `FactionSummary` objects
- **AND** each `FactionSummary` SHALL contain `slug`, `name`, `category` (string or null), `icon` (string or null), and `unitCount` (number)
- **AND** only factions with `unitCount > 0` SHALL be included

#### Scenario: No factions exist

- **WHEN** the `factions` table is empty
- **THEN** the response SHALL have status 200 with `{ "factions": [] }`

### Requirement: Get Faction Endpoint

The system SHALL expose a `GET /factions/{faction_slug}` endpoint that returns all units (as `UnitFull` objects) and detachments for a faction.

#### Scenario: Successful faction retrieval

- **WHEN** a client sends `GET /factions/space-marines` and the faction exists
- **THEN** the response SHALL have status 200 and a JSON body with `factionSlug`, `units` (array of `UnitFull`), and `detachments` (array of `DetachmentData`)

#### Scenario: Faction not found

- **WHEN** a client sends `GET /factions/nonexistent`
- **THEN** the response SHALL have status 404 with `{ "error": "Faction not found" }`

### Requirement: Get Unit Endpoint

The system SHALL expose a `GET /factions/{faction_slug}/units/{unit_slug}` endpoint that returns a single `UnitFull` object.

#### Scenario: Successful unit retrieval

- **WHEN** a client sends `GET /factions/space-marines/units/intercessor-squad` and the unit exists
- **THEN** the response SHALL have status 200 and a JSON body with `factionSlug` and `unit` (a `UnitFull` object)

#### Scenario: Unit not found

- **WHEN** the unit slug does not exist in the specified faction
- **THEN** the response SHALL have status 404 with `{ "error": "Unit not found" }`

### Requirement: UnitFull Response Type

The `UnitFull` type SHALL group all data for a single unit into one object, eliminating the need for client-side joins across parallel arrays.

#### Scenario: UnitFull with all data present

- **WHEN** a unit has catalog info, base data, structured abilities, and loadout data
- **THEN** `UnitFull` SHALL contain `slug`, `name`, `category`, `points`, `keywords`, `baseData` (raw datasheet object), `abilities` (object with `tag`, `abilities`, `rawAbilities`, `baseDataHash`), and `loadout` (object with `tag`, `options`)

#### Scenario: UnitFull with partial data

- **WHEN** a unit has catalog info but no base data, abilities, or loadout
- **THEN** `baseData` SHALL be `null`, `abilities` SHALL be `null`, and `loadout` SHALL be `null`

#### Scenario: UnitFull abilities tag reflects processing status

- **WHEN** a unit's structured abilities have `tag: "CONFIRMED"`
- **THEN** the `abilities.tag` field in the `UnitFull` response SHALL be `"CONFIRMED"`

### Requirement: Subfaction Parent Fallback

The endpoints SHALL resolve data using the subfaction parent fallback: if a unit's base data, abilities, or loadout is not found under the requested faction, the system SHALL look up the parent faction and use its data.

#### Scenario: Unit data inherited from parent faction

- **WHEN** `GET /factions/blood-angels/units/intercessor-squad` is called and the unit's abilities exist under `space-marines` but not `blood-angels`
- **THEN** the `abilities` field SHALL contain the data from `space-marines`

#### Scenario: No parent fallback needed

- **WHEN** the unit's data exists directly under the requested faction
- **THEN** the data from the requested faction SHALL be used without checking the parent

### Requirement: Authentication

All endpoints SHALL require a valid Supabase anon key in the `Authorization: Bearer <key>` header.

#### Scenario: Valid authorization

- **WHEN** a request includes a valid `Authorization: Bearer <anon_key>` header
- **THEN** the request SHALL be processed normally

#### Scenario: Missing or invalid authorization

- **WHEN** a request lacks the `Authorization` header or provides an invalid key
- **THEN** the response SHALL have status 401 with `{ "error": "Unauthorized" }`

### Requirement: CORS Headers

All endpoints SHALL include CORS headers allowing requests from any origin, since external consumers (CLI tools, other apps) need access.

#### Scenario: Preflight CORS request

- **WHEN** a client sends an `OPTIONS` request to any endpoint
- **THEN** the response SHALL include `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: authorization, content-type`, and status 200

#### Scenario: Regular request includes CORS headers

- **WHEN** a client sends a `GET` request to any endpoint
- **THEN** the response SHALL include `Access-Control-Allow-Origin: *`

### Requirement: Error Response Format

All error responses SHALL use a consistent JSON format with an `error` field containing a human-readable message.

#### Scenario: Client error response

- **WHEN** a request results in a 400 or 404 error
- **THEN** the response body SHALL be `{ "error": "<message>" }` with `Content-Type: application/json`

#### Scenario: Server error response

- **WHEN** an unexpected error occurs during processing
- **THEN** the response SHALL have status 500 with `{ "error": "Internal server error" }`
- **AND** the response SHALL NOT expose internal error details
