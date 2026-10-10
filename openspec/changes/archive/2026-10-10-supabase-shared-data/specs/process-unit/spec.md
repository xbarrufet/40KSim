# Spec Delta

## MODIFIED Requirements

### Requirement: Confirm Action
Saving the Process Unit screen SHALL write the StructuredAbilitiesData to Supabase first (with `tag` set to `CONFIRMED`), then update the IndexedDB cache. The save SHALL fail if the Supabase write fails, regardless of whether the previous tag was `PENDING` or `AI_PROPOSED`.

#### Scenario: Confirm with Supabase available
- **WHEN** the user confirms a unit's structured abilities and Supabase is reachable
- **THEN** the StructuredAbilitiesData SHALL be written to Supabase with `tag: CONFIRMED`
- **AND** the IndexedDB cache SHALL be updated with the same data

#### Scenario: Confirm with Supabase unavailable
- **WHEN** the user confirms a unit's structured abilities but Supabase is unreachable
- **THEN** the save SHALL fail with an error message
- **AND** the IndexedDB cache SHALL NOT be updated

### Requirement: Automatic Preprocessing on First Upload
When BaseData is uploaded for a unit that has no existing StructuredAbilitiesData, the system SHALL automatically generate a StructuredAbilitiesData proposal tagged `PENDING` and write it to Supabase first, then cache in IndexedDB.

#### Scenario: Auto-generate proposal with Supabase available
- **WHEN** BaseData is uploaded for a new unit and Supabase is reachable
- **THEN** a PENDING StructuredAbilitiesData record SHALL be written to Supabase
- **AND** the same record SHALL be cached in IndexedDB

#### Scenario: Auto-generate proposal with Supabase unavailable
- **WHEN** BaseData is uploaded for a new unit but Supabase is unreachable
- **THEN** the operation SHALL fail with an error message
