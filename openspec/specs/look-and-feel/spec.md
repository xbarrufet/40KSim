# Look and Feel Specification

## Purpose

Defines the visual and interaction requirements that apply across the app's shared chrome and the List/Game screens: the dark tactical theme's touch-target sizing, hover-independent interaction states, contrast and text-size floors, iPad-width responsive layout, offline font/icon behaviour, section header sizing, weapon table attribution cell appearance, and the placement and exclusivity of the owner-boundary divider line within weapon tables.

## Requirements

### Requirement: Minimum Touch Target Size
Every interactive element within the themed chrome and List/Game screens (icon buttons, tab nav items, roster rows) SHALL have a tappable area of at least 44x44 points, regardless of the size of its visible icon or label.

#### Scenario: Icon-only button sized for touch
- **WHEN** an icon-only button (e.g. upload, delete, back) is rendered in a themed screen
- **THEN** its tappable area is at least 44x44 points, even if the visible icon inside it is smaller

#### Scenario: Roster row sized for touch
- **WHEN** a roster row is rendered in the list-view screen's left column
- **THEN** its tappable height is at least 44 points

### Requirement: Selection and Active State Independent of Hover
Visual states that communicate selection or affordance (a selected roster row, a pressed button) SHALL be conveyed without relying on a `:hover`-only style, and SHALL provide a visible pressed/active state while touched.

#### Scenario: Selected roster row visible without a pointer
- **WHEN** a roster row is selected on a touch-only device with no mouse hover available
- **THEN** the row's selected state (e.g. border or background change) is visible exactly as it would be with a mouse hovering over it

#### Scenario: Tap feedback on buttons and rows
- **WHEN** the user touches a themed interactive element
- **THEN** that element shows a visible pressed/active state for the duration of the touch, distinct from its resting and selected states

### Requirement: Minimum Legible Text Size
Text in the themed chrome and List/Game screens SHALL be rendered no smaller than 12 points for labels and captions, and no smaller than 15 points for primary data values in stat and weapon tables.

#### Scenario: Smallest label text
- **WHEN** a label or caption (e.g. a roster row's model-count text) is rendered in a themed screen
- **THEN** its font size is at least 12 points

#### Scenario: Stat and weapon table figures
- **WHEN** a stat or weapon profile value (e.g. Toughness, Strength, Damage) is rendered in a themed table
- **THEN** its font size is at least 15 points

### Requirement: Minimum Contrast for Bright-Room Legibility
Body text and primary data values in the themed chrome and List/Game screens SHALL maintain a contrast ratio of at least 4.5:1 against their background, so the dark theme stays legible at a brightly lit table, not only in a dim room.

#### Scenario: Label text against its panel background
- **WHEN** a label, caption, or body-text element is rendered on its themed background
- **THEN** the contrast ratio between that text and its background is at least 4.5:1

### Requirement: Responsive Two-Column Layout at iPad Widths
The list-view screen's roster+datasheet two-column layout SHALL remain side-by-side at iPad landscape widths and SHALL adapt to a layout where both the roster and the selected unit's datasheet stay reachable without horizontal scrolling at iPad portrait widths, rather than collapsing at a breakpoint unrelated to actual device sizes.

#### Scenario: Landscape width keeps two columns
- **WHEN** the list-view screen is shown at a viewport width of 1024 points or more
- **THEN** the roster and datasheet are shown side-by-side

#### Scenario: Portrait width remains usable
- **WHEN** the list-view screen is shown at a viewport width between 744 and 834 points (iPad portrait)
- **THEN** the layout adapts so both the full roster list and the selected unit's datasheet remain readable and reachable without horizontal scrolling

### Requirement: No External Runtime Font or Icon Dependency
The themed chrome and List/Game screens SHALL render their fonts and icons without requesting any third-party CDN at runtime, so the app's offline-first PWA behavior is unaffected.

#### Scenario: Fonts and icons available offline
- **WHEN** the app is launched with no network connection, after at least one prior successful load
- **THEN** the themed chrome and List/Game screens render with their intended fonts and icons, not a fallback caused by a failed network request

### Requirement: Section Header Text Size

The list-view screen's section headers (Models, Ranged Weapons, Melee Weapons, Abilities) SHALL render at a text size at least as large as the primary data text in the tables they introduce, so the heading reads clearly above the data rather than blending into smaller label text.

#### Scenario: Section header size
- **WHEN** a section header ("Models", "Ranged Weapons", "Melee Weapons", or "Abilities") is rendered on the list-view screen
- **THEN** its font size is at least 15 points

### Requirement: Weapon Table Attribution Cell Styling

The weapon table's attribution (model/owner) cell SHALL be visually distinct from the weapon name cell in the same row, so the owner label reads as metadata rather than a weapon name.

#### Scenario: Attribution cell visually distinct from the weapon name
- **WHEN** a weapon table row's attribution column is rendered
- **THEN** its text color is visually distinct from the weapon name cell next to it

### Requirement: Weapon Table Owner-Boundary Divider

A weapon table (Ranged Weapons or Melee Weapons) SHALL display a horizontal divider only at the boundary between one unit/character's weapon rows and the next unit/character's weapon rows. No other horizontal line SHALL appear within a weapon table.

#### Scenario: Divider is the only visible row-separator in a weapon table
- **WHEN** a weapon table renders consecutive rows attributed to the same unit or character, including a weapon's own stat row followed by its ability-chip row
- **THEN** no horizontal line separates those rows — not between a weapon's stat row and its own ability-chip row, and not between two different weapons belonging to the same unit or character

#### Scenario: Divider only at an ownership boundary
- **WHEN** a weapon table has consecutive rows attributed to the same unit or character, followed by one or more rows attributed to a different unit or character (e.g. rows 1-2 belong to the squad and row 3 belongs to an attached leader)
- **THEN** a horizontal divider is drawn only between the last row of one owner (whichever row that is — a stat row or an ability-chip row) and the first row of the next, and that divider is the only horizontal line visible anywhere in the table
