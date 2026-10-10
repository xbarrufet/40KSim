# Faction & Unit Browser Specification

## Purpose

Allow the user to browse all factions and their units from the main app, upload BaseData JSON files to enrich units, and navigate to the Process Unit screen. This replaces the removed `/admin` panel with a unified experience that works identically in dev and production. All data is stored in IndexedDB.

## Requirements

### Requirement: Tab Rename

The HOME tab in the main navigation SHALL be renamed to **FACTIONS**.

#### Scenario: User sees the main nav
- **WHEN** the app loads
- **THEN** the main nav shows FACTIONS, LIST, and GAME tabs

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

### Requirement: Faction Detail Navigation

Tapping a faction card SHALL navigate to the faction detail view (unit list) within the FACTIONS tab.

#### Scenario: Navigate to faction detail
- **WHEN** the user taps a faction card
- **THEN** the faction grid is replaced by the unit list for that faction
- **AND** the FACTIONS tab remains highlighted in the nav bar

#### Scenario: Navigate back
- **WHEN** the user taps the back button in the faction detail top bar
- **THEN** the view returns to the faction list

### Requirement: Faction Detail Top Bar

The faction detail view SHALL have a top bar with a back button, the faction name, and an upload button.

#### Scenario: Top bar elements visible
- **WHEN** the user navigates to a faction detail view
- **THEN** the top bar displays a back button, the faction name, and an upload button

### Requirement: Unit List

The unit list for a faction SHALL display each unit with a status indicator. The indicator SHALL reflect three states: red for units with no reviewed abilities (`PENDING`), amber for units with AI-proposed abilities awaiting human review (`AI_PROPOSED`), and green for units that have been manually confirmed (`CONFIRMED`).

#### Scenario: Unit with no BaseData
- **WHEN** no BaseData exists in IndexedDB for the unit
- **THEN** the status light is **red**

#### Scenario: Unit with BaseData only
- **WHEN** BaseData exists for the unit but its StructuredAbilitiesData has `tag: "PENDING"`
- **THEN** the status light is **red**

#### Scenario: Unit with both BaseData and UnitData
- **WHEN** BaseData exists for the unit and its StructuredAbilitiesData has `tag: "CONFIRMED"`
- **THEN** the status light is **green**

#### Scenario: Red indicator for unprocessed unit
- **WHEN** a unit's StructuredAbilitiesData has `tag: "PENDING"` or no StructuredAbilitiesData record exists
- **THEN** the unit's status indicator is red

#### Scenario: Amber indicator for AI-proposed unit
- **WHEN** a unit's StructuredAbilitiesData has `tag: "AI_PROPOSED"`
- **THEN** the unit's status indicator is amber

#### Scenario: Green indicator for confirmed unit
- **WHEN** a unit's StructuredAbilitiesData has `tag: "CONFIRMED"`
- **THEN** the unit's status indicator is green

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

### Requirement: Admin Removal

The `/admin` route and all admin-only code SHALL be removed: `AdminApp.tsx`, `FactionList.tsx`, `FactionDetail.tsx`, `PointsPanel.tsx`, `JobLog.tsx`, `useJobPolling.ts`, `admin.css`, `factionDetail.css`.

#### Scenario: No admin files remain
- **WHEN** the implementation is complete
- **THEN** the `app/src/admin/` directory and all files within it are deleted
- **AND** no import references to the admin directory exist in the codebase

### Requirement: Slug field in seed data

The Python scraper and the seed file (`units.json`) SHALL include an explicit `slug` field for every faction and every unit. The `UnitCatalog` TypeScript interfaces SHALL be updated to include `slug` on both `Faction` and `UnitProfile`.

#### Scenario: Seed file includes faction slugs
- **WHEN** the seed file is generated by the scraper
- **THEN** each faction object contains a `slug` string field

#### Scenario: Seed file includes unit slugs
- **WHEN** the seed file is generated by the scraper
- **THEN** each unit object contains a `slug` string field

#### Scenario: TypeScript interfaces reflect slugs
- **WHEN** the app compiles
- **THEN** `Faction` interface includes `slug: string`
- **AND** `UnitProfile` interface includes `slug: string`

### Requirement: No empty-state admin reference

The empty-state message in the faction list SHALL NOT reference the `/admin` panel. If IndexedDB is empty and seeding succeeds, factions are displayed normally. If seeding fails, an error message is shown without referencing admin.

#### Scenario: Seeding succeeds
- **WHEN** IndexedDB is empty and the seed file loads successfully
- **THEN** factions are displayed — no empty-state message is shown

#### Scenario: Seeding fails
- **WHEN** the seed file cannot be loaded
- **THEN** an error alert is shown describing the failure
- **AND** the message does not reference `/admin`

### Requirement: No faction-level status lights

Faction cards in the faction list SHALL NOT display aggregate status lights. Each card shows the faction name, icon, and BaseData/UnitData counts. Status lights are displayed only at the unit level in the faction detail view.

#### Scenario: Faction card content
- **WHEN** the user views the faction list
- **THEN** each faction card shows the faction name, icon, and data counters
- **AND** no status light or color indicator appears on the faction card

### Requirement: Faction icon

Each faction card SHALL display an icon. The icon path is stored in the faction data as `/icons/<faction-slug>-icon.svg`. If the icon fails to load, the card SHALL display without it gracefully.

#### Scenario: Faction has icon
- **WHEN** a faction card is displayed
- **THEN** it shows the faction icon from the stored icon path

#### Scenario: Icon fails to load
- **WHEN** the icon image fails to load
- **THEN** the card displays without the icon — no broken image shown

### Requirement: Seed file contains factions only

The seed file (`/data/units.json`) is no longer required for normal operation. On first launch, the app SHALL fetch faction data from Supabase instead of from a static JSON file. The seed file MAY be retained in the repository but SHALL NOT be fetched or used at runtime when Supabase is available.

#### Scenario: First launch with Supabase
- **WHEN** the app starts with an empty IndexedDB and Supabase is reachable
- **THEN** it SHALL fetch factions from Supabase
- **AND** it SHALL NOT attempt to fetch `/data/units.json`

#### Scenario: First launch without Supabase and no env vars
- **WHEN** the app starts with an empty IndexedDB in offline/fallback mode (no Supabase env vars)
- **THEN** it SHALL fall back to fetching `/data/units.json` as before

### Requirement: Proposals Import Modal

The AI proposals import modal SHALL follow the same two-phase pattern as the BaseData upload modal: drop phase (file selection) and confirmation phase (preview + commit). It SHALL use the same CSS classes and visual structure as the BaseData upload modal so the two interactions are consistent.

#### Scenario: Drop zone renders with drag feedback

- **WHEN** the proposals import modal is open
- **THEN** it shows a styled drop zone using the existing `.drop-zone` CSS class
- **AND** while a file is dragged over the zone, the zone gains the `.drag-over` class for visual feedback

#### Scenario: File input fallback

- **WHEN** the user clicks the drop zone label instead of dragging
- **THEN** a file picker opens and accepts a single `.json` file, entering the same preview flow as a drag-and-drop

#### Scenario: Preview list with checkboxes after file selection

- **WHEN** a proposals JSON file is dropped or selected
- **THEN** the modal parses the file and checks each unit entry against IndexedDB
- **AND** shows a scrollable list with one row per unit, each row having a checkbox, the unit slug, and the unit's current tag label (NUEVO, PENDING, AI_PROPOSED, CONFIRMED)
- **AND** units with no existing data, tag PENDING, or tag AI_PROPOSED have their checkbox checked by default
- **AND** units with tag CONFIRMED have their checkbox unchecked by default

#### Scenario: Select All toggle

- **WHEN** the preview list is shown
- **THEN** a "Seleccionar todo" checkbox appears above the list
- **AND** checking it checks all unit rows; unchecking it unchecks all rows
- **AND** the toggle reflects a mixed state (indeterminate) when some but not all rows are checked

#### Scenario: Confirm imports checked rows and overwrites

- **WHEN** the user clicks "Confirmar" after reviewing the preview
- **THEN** the modal writes each checked unit's data to IndexedDB with tag `AI_PROPOSED`, regardless of the unit's previous tag
- **AND** unchecked units are not written
- **AND** the modal closes and the faction unit list refreshes

#### Scenario: Confirm count reflects checked rows

- **WHEN** the preview list is shown
- **THEN** the "Confirmar" button label shows the count of currently checked rows

#### Scenario: Confirm is disabled until a file is loaded

- **WHEN** no file has been dropped yet
- **THEN** the "Confirmar" button is disabled

#### Scenario: Cancel at any point

- **WHEN** the user clicks "Cancelar" or the overlay backdrop
- **THEN** the modal closes without writing anything to IndexedDB

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

## Data Structures

### IndexedDB Schema

| Store | Key | Value |
|---|---|---|
| `factions` | faction `id` | `{ id, name, slug, category }` |
| `units` | `"<faction-slug>/<unit-slug>"` | `{ id, name, slug, factionSlug, category, points, keywords }` |
| `baseData` | `"<faction-slug>/<unit-slug>"` | Raw BaseData JSON (as uploaded) |
| `unitData` | `"<faction-slug>/<unit-slug>"` | Processed UnitData JSON (written by future Process Unit screen) |

The `factions` and `units` stores are seeded from `units.json`. The `baseData` and `unitData` stores start empty.

### Seed File

The seed file remains the current `UnitCatalog` shape defined in `app/src/data/schema.ts` (schemaVersion 1). The seeding process unpacks it into the IndexedDB stores.

### BaseData Example (`ancient.json`)

```json
{
  "id": 47128,
  "slug": "ancient",
  "name": "Ancient",
  "keywords": ["CHARACTER", "INFANTRY", "IMPERIUM", "TACTICUS"],
  "stats": { "movement": 6, "toughness": 5, "save": 3, "invulnerableSave": null, "wounds": 4, "leadership": 6, "objectiveControl": 2 },
  "wargear": [ ... ],
  "abilities": [ ... ]
}
```

## Out of Scope

- Process Unit screen (dead links for now — future spec)
- Faction CRUD (create, rename, delete factions — future spec)
- Points editing (handled in future Process Unit screen)
- UnitData generation (future Process Unit screen concern)
- Reset / re-seed mechanism
- Service worker caching of IndexedDB data
- Export / backup of IndexedDB data
