# Spec Delta

## MODIFIED Requirements

### Requirement: Faction List

The FACTIONS tab SHALL display all factions as clickable cards grouped by category.

#### Scenario: Factions are available
- **WHEN** the user is on the FACTIONS tab
- **THEN** all factions from IndexedDB are displayed as cards grouped by category
- **AND** each card shows the faction name, icon, and BaseData/UnitData counts

#### Scenario: First launch (empty IndexedDB)
- **WHEN** IndexedDB is empty
- **THEN** the app seeds it from the static `/data/units.json` file
- **AND** the seed file includes an explicit `slug` field on each faction and each unit
- **AND** after seeding, factions are displayed normally

#### Scenario: Seed file provides slugs
- **WHEN** the seed file is loaded
- **THEN** each faction entry includes a `slug` field (e.g. `"space-marines"`)
- **AND** each unit entry includes a `slug` field (e.g. `"ancient"`)
- **AND** these slugs are used to construct IndexedDB keys (`"<faction-slug>/<unit-slug>"`)

#### Scenario: Faction card counters
- **WHEN** a faction card is displayed
- **THEN** it shows the count of units with BaseData and the count of units with UnitData
- **AND** the format is `N base / M processed` in smaller text below the faction name

### Requirement: No faction-level status lights

Faction cards in the faction list SHALL NOT display aggregate status lights. Each card shows the faction name, icon, and BaseData/UnitData counts. Status lights are displayed only at the unit level in the faction detail view.

#### Scenario: Faction card content
- **WHEN** the user views the faction list
- **THEN** each faction card shows the faction name, icon, and data counters
- **AND** no status light or color indicator appears on the faction card

### Requirement: Upload Modal

The upload button SHALL open a modal overlay with two vertical sections: a drop zone and a file list.

#### Scenario: Upload matching files
- **WHEN** the user drops one or more `.json` files
- **THEN** each file is matched to a unit by filename slug (e.g. `ancient.json` → slug `ancient`)
- **AND** the file list shows each file with its matched unit name

#### Scenario: File matches existing unit
- **WHEN** a file's slug matches an existing unit in the current faction
- **THEN** confirming will **replace** that unit's BaseData in IndexedDB

#### Scenario: File does not match any unit
- **WHEN** a file's slug does not match any unit in the current faction
- **THEN** confirming will **create** the unit and store the BaseData automatically

#### Scenario: Cancel upload
- **WHEN** the user clicks Cancel
- **THEN** the modal closes with no side effects

#### Scenario: Confirm upload
- **WHEN** the user clicks Confirm
- **THEN** all files are written to IndexedDB: new units are auto-created, existing units get their BaseData replaced
- **AND** the unit list refreshes to reflect updated status lights

## ADDED Requirements

### Requirement: Faction icon

Each faction card SHALL display an icon. The icon path is stored in the faction data as `/icons/<faction-slug>-icon.svg`. If the icon fails to load, the card SHALL display without it gracefully.

#### Scenario: Faction has icon
- **WHEN** a faction card is displayed
- **THEN** it shows the faction icon from the stored icon path

#### Scenario: Icon fails to load
- **WHEN** the icon image fails to load
- **THEN** the card displays without the icon — no broken image shown

### Requirement: Seed file contains factions only

The seed file (`/data/units.json`) SHALL contain only faction data (name, slug, category, icon). Units are NOT included in the seed file — they are created when BaseData is uploaded.

#### Scenario: Seed file structure
- **WHEN** the seed file is loaded
- **THEN** each faction entry contains `id`, `slug`, `name`, `category`, and `icon`
- **AND** the `units` array is empty for each faction

#### Scenario: Units not in seed
- **WHEN** the app seeds IndexedDB from the seed file
- **THEN** only the `factions` store is populated
- **AND** the `units` store remains empty
