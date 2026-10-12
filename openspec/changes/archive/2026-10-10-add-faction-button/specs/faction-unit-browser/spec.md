# Spec Delta

## ADDED Requirements

### Requirement: Faction Grid Filters to Factions With Data
The faction grid SHALL display only factions whose unit_count is greater than zero.

#### Scenario: Faction with units
- **WHEN** a faction has unit_count > 0
- **THEN** it SHALL appear in the faction grid

#### Scenario: Faction without units
- **WHEN** a faction has unit_count = 0
- **THEN** it SHALL NOT appear in the faction grid

### Requirement: Add Faction Button
The factions screen SHALL display an "Añadir facción" button that opens a modal to upload unit data for a faction that has no units yet.

#### Scenario: Button visible
- **WHEN** the factions screen is displayed
- **THEN** an "Añadir facción" button SHALL be visible in the page heading area

### Requirement: Add Faction Modal
The add-faction modal SHALL allow the user to select a faction without units from a dropdown and upload its units JSON file.

#### Scenario: Open modal
- **WHEN** the user taps "Añadir facción"
- **THEN** a modal overlay SHALL appear with a dropdown of factions that have no units and a file drop zone for the units JSON

#### Scenario: Dropdown contents
- **WHEN** the modal is displayed
- **THEN** the dropdown SHALL list all factions from Supabase whose unit_count is 0, sorted alphabetically

#### Scenario: Upload units JSON
- **WHEN** the user selects a faction and drops a units JSON file
- **THEN** the modal SHALL parse the file expecting the format `{ "units": [{ "name", "slug", "category", "points" }] }` matching the scraper output
- **AND** display the number of units found

#### Scenario: Confirm
- **WHEN** the user confirms with a selected faction and a valid units file
- **THEN** the units SHALL be registered via `syncUnitCatalog` with the selected faction's slug
- **AND** the faction's unit_count SHALL be updated
- **AND** the factions grid SHALL refresh to show the newly populated faction
- **AND** the modal SHALL close

#### Scenario: Confirm disabled
- **WHEN** no faction is selected or no units file has been uploaded
- **THEN** the confirm button SHALL be disabled

#### Scenario: Cancel
- **WHEN** the user cancels the modal
- **THEN** the modal SHALL close with no side effects
