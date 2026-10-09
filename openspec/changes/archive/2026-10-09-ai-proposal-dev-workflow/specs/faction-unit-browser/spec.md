# Spec Delta

## MODIFIED Requirements

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
