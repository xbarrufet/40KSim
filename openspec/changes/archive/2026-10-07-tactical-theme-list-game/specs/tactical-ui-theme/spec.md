# Spec Delta

## Purpose

Defines the app's touch-first interaction model and dark tactical visual theme requirements for the shared app chrome and the List/Game roster+datasheet screens, so the UI is legible and usable on an iPad PWA rather than a mouse-driven desktop screen.

## ADDED Requirements

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
