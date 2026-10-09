# Spec Delta

## ADDED Requirements

### Requirement: Proposals Import Modal

The AI proposals import modal SHALL follow the same two-phase pattern as the BaseData upload modal: drop phase (file selection) and confirmation phase (preview + commit). It SHALL use the same CSS classes and visual structure as the BaseData upload modal so the two interactions are consistent.

#### Scenario: Drop zone renders with drag feedback

- **WHEN** the proposals import modal is open
- **THEN** it shows a styled drop zone using the existing `.drop-zone` CSS class
- **AND** while a file is dragged over the zone, the zone gains the `.drag-over` class for visual feedback

#### Scenario: File input fallback

- **WHEN** the user clicks the drop zone label instead of dragging
- **THEN** a file picker opens and accepts a single `.json` file, entering the same preview flow as a drag-and-drop

#### Scenario: Preview list after file selection

- **WHEN** a `structuring_proposals.json` file is dropped or selected
- **THEN** the modal parses the file and checks each unit entry against IndexedDB
- **AND** shows a scrollable list with one row per unit in the file, displaying the unit slug and its import status
- **AND** units that will be imported (no existing data, or existing data with tag `PENDING`) show a green "Importar" indicator
- **AND** units that will be skipped (existing data with tag `CONFIRMED` or `AI_PROPOSED`) show a muted "Ya existe" indicator

#### Scenario: Confirm is disabled until a file is loaded

- **WHEN** no file has been dropped yet
- **THEN** the "Confirmar" button is disabled

#### Scenario: Confirm imports and closes

- **WHEN** the user clicks "Confirmar" after reviewing the preview
- **THEN** the modal writes each importable unit to IndexedDB and closes
- **AND** the faction unit list refreshes to reflect the new data

#### Scenario: Cancel at any point

- **WHEN** the user clicks "Cancelar" or the overlay backdrop
- **THEN** the modal closes without writing anything to IndexedDB
