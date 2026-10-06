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
- **THEN** it shows the count of units with BaseData and the count of units whose StructuredAbilitiesData has `tag: "CONFIRMED"`
- **AND** the format is `N base / M processed` in smaller text below the faction name

### Requirement: Unit List

Units SHALL be listed grouped by category. Each unit row shows:
- Unit name — rendered as a **link** (dead link for now; future spec wires it to Process Unit screen)
- Points (read-only; dash if null)
- Status light (red / green)

#### Scenario: Unit with no BaseData
- **WHEN** no BaseData exists in IndexedDB for the unit
- **THEN** the status light is **red**

#### Scenario: Unit with BaseData only
- **WHEN** BaseData exists for the unit but its StructuredAbilitiesData has `tag: "PENDING"`
- **THEN** the status light is **red**

#### Scenario: Unit with both BaseData and UnitData
- **WHEN** BaseData exists for the unit and its StructuredAbilitiesData has `tag: "CONFIRMED"`
- **THEN** the status light is **green**

### Requirement: Upload Modal

The upload button SHALL open a modal overlay with two vertical sections: a drop zone and a file list.

#### Scenario: Upload matching files
- **WHEN** the user drops one or more `.json` files
- **THEN** each file is matched to a unit by filename slug (e.g. `ancient.json` → slug `ancient`)
- **AND** the file list shows each file with its matched unit name

#### Scenario: File matches existing unit
- **WHEN** a file's slug matches an existing unit in the current faction
- **THEN** confirming will **replace** that unit's BaseData in IndexedDB
- **AND** the unit's catalogue `name` is refreshed from the uploaded BaseData's own `name` field
- **AND** the unit's existing StructuredAbilitiesData, if any, is left unchanged regardless of its `tag`

#### Scenario: File does not match any unit
- **WHEN** a file's slug does not match any unit in the current faction
- **THEN** confirming will **create** the unit using the uploaded BaseData's own `name` field (not the file slug) as the unit's catalogue name, store the BaseData automatically, and automatically generate StructuredAbilitiesData for it with `tag: "PENDING"`

#### Scenario: Cancel upload
- **WHEN** the user clicks Cancel
- **THEN** the modal closes with no side effects

#### Scenario: Confirm upload
- **WHEN** the user clicks Confirm
- **THEN** all files are written to IndexedDB: new units are auto-created (named from their BaseData's own `name` field) with a `PENDING` StructuredAbilitiesData proposal, existing units get their BaseData replaced, their catalogue `name` refreshed from it, and their StructuredAbilitiesData left untouched
- **AND** the unit list refreshes to reflect updated status lights
