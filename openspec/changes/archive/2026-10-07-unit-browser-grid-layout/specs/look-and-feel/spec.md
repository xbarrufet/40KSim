# Spec Delta

## ADDED Requirements

### Requirement: Faction Unit Grid — Four-Column Balanced Layout

The faction detail view's unit list SHALL render in a four-column layout. All items (category headers and unit rows) SHALL be flattened into a single ordered list and distributed greedily across the four columns so that each column's height is approximately equal (target = total item count / 4). A category header and its units need not start a new column; both may be split across column boundaries.

#### Scenario: Items distributed across four columns
- **WHEN** the faction detail view renders its unit list
- **THEN** the list is laid out in exactly four columns
- **AND** items are assigned left-to-right until each column reaches the target height
- **AND** the resulting column heights are approximately equal

#### Scenario: Category spans columns
- **WHEN** a category's units overflow the remaining space in the current column
- **THEN** the remaining units continue in the next column without repeating the category header

### Requirement: Unit Row — No Separator Lines

Unit rows in the faction detail view SHALL NOT display a horizontal separator between consecutive rows. Vertical rhythm is conveyed by padding only.

#### Scenario: No border between unit rows
- **WHEN** consecutive unit rows are rendered in the faction detail view
- **THEN** no horizontal line is drawn between them

### Requirement: Status Light Adjacent to Unit Name

The status light in a faction detail unit row SHALL be positioned immediately after the unit name text. The far-right position of the row SHALL be reserved for the points badge.

#### Scenario: Status dot follows unit name
- **WHEN** a unit row is rendered in the faction detail view
- **THEN** the status dot appears directly after the unit name text
- **AND** the right end of the row shows the points badge, not the status dot

### Requirement: Unit Row Points Pill Badge

Each unit row in the faction detail view SHALL display the unit's points value as a dark pill badge, right-aligned in the row. The badge SHALL show the numeric value only (no suffix). It SHALL display `0` when the points value is null.

#### Scenario: Known points shown as badge
- **WHEN** a unit row is rendered with a non-null points value
- **THEN** the numeric points value appears in a dark-background pill badge at the far right of the row

#### Scenario: Null points shows zero
- **WHEN** a unit row is rendered and the unit's points value is null
- **THEN** the badge displays `0`
