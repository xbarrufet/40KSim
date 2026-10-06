# Spec Delta

## Purpose

Give players a read-only, two-column view of a saved army list's roster and each unit's live datasheet, filtered to what it actually brings to the battlefield, for use both when reviewing a list and during a game.

## ADDED Requirements

### Requirement: Roster Grouped by Category

The list-view screen's left column SHALL display the list's entries grouped by their parsed category, each row showing the unit name, model count, points, and leader/attachment text when present.

#### Scenario: Entries grouped by category
- **WHEN** the list-view screen is open for a list
- **THEN** each entry appears under a heading for its category, in the order the categories appear in the list

#### Scenario: Row summary fields
- **WHEN** an entry row is rendered
- **THEN** it shows the entry's unit name, model count, and points
- **AND** if the entry has attachment text (Attached to / Led by / Supported by), that text is shown on the row

### Requirement: Unit Selection

The left column SHALL let the user select a unit, highlighting the selected row and displaying that unit in the right column.

#### Scenario: Selecting a row
- **WHEN** the user clicks an entry row
- **THEN** that row is visually marked as selected
- **AND** the right column shows that entry's datasheet per the Live Unit Datasheet From BaseData requirement

#### Scenario: Default selection
- **WHEN** the list-view screen opens
- **THEN** the first entry in the list is selected by default

### Requirement: Live Unit Datasheet From BaseData

For a selected entry whose unit is matched to the catalogue and has an uploaded BaseData record, the right column SHALL display that unit's stats, weapon profiles, and ability text computed directly from BaseData, regardless of whether the unit's UnitData has been confirmed.

#### Scenario: Datasheet computed from BaseData
- **WHEN** the selected entry's matched unit has a BaseData record
- **THEN** the right column shows that unit's stats (one row per miniature), its wargear catalogue, and its raw ability text, derived from BaseData without requiring a CONFIRMED UnitData record

#### Scenario: Confirmed UnitData not required
- **WHEN** the selected entry's matched unit has BaseData but no UnitData record, or a UnitData record tagged PENDING
- **THEN** the datasheet is still shown in full, exactly as it would be for a CONFIRMED unit

### Requirement: Weapon Tables Filtered to Declared Loadout

The right column's weapon tables SHALL show only the wargear the entry's own loadout text specifies, not the unit's full datasheet options.

#### Scenario: Matching loadout tokens to wargear profiles
- **WHEN** the selected entry's wargear tokens are matched case-insensitively against the matched unit's BaseData-derived wargear item and weapon profile names
- **THEN** only the matching wargear items' weapon profiles appear in the ranged/melee tables

#### Scenario: Unrecognized loadout token
- **WHEN** a wargear token does not match any wargear item or weapon profile name in the unit's BaseData
- **THEN** that token's original text is still shown, as plain text rather than a table row, so it is not silently dropped

### Requirement: No-Datasheet Fallback

When a selected entry's unit is not matched to the catalogue, or is matched but has no BaseData record, the right column SHALL display only the entry's own stored fields with a notice that no datasheet is available.

#### Scenario: Unmatched unit
- **WHEN** the selected entry's unit name did not match any catalogue unit
- **THEN** the right column shows the entry's name, points, models, raw wargear text, and attachment text, plus a notice that no datasheet is available

#### Scenario: Matched unit without BaseData
- **WHEN** the selected entry's unit is matched but has no BaseData record uploaded
- **THEN** the right column shows the same fallback as for an unmatched unit

### Requirement: No Admin Review Context in List View

The right column SHALL NOT display the Costs, Unit Composition, Led by, or Supported by sections — those are Process Unit review context, not needed when browsing a list or during a game.

#### Scenario: Admin-only sections omitted
- **WHEN** the right column renders a selected entry's datasheet
- **THEN** no Costs, Unit Composition, Led by, or Supported by section appears, regardless of what the unit's BaseData contains

### Requirement: Combined Leader/Support Datasheet

When the selected entry's attachment text names a leader or support character (`Led by <name>` / `Supported by <name>`) that is itself a matched entry elsewhere in the same list, the Models table, weapon tables, and ability list SHALL include that character's models, loadout-filtered wargear, and abilities alongside the squad's own.

#### Scenario: Attached character's models and weapons merged in
- **WHEN** the selected entry's attachment text is `Led by <name>` or `Supported by <name>`, and an entry named `<name>` elsewhere in the list is matched to a BaseData record
- **THEN** the Models table includes that character's own model row(s) in addition to the selected entry's
- **AND** the weapon tables include that character's wargear, filtered to that character's own loadout text, in addition to the selected entry's

#### Scenario: Attached character's abilities merged in
- **WHEN** the selected entry has an attached character resolved as above
- **THEN** that character's ability text is shown alongside the selected entry's own, with any ability sharing the same name as one already shown (e.g. a faction-wide ability both units have) shown only once

#### Scenario: Named character has no entry or no BaseData
- **WHEN** the selected entry's attachment text names a leader or support character that has no matching entry in the list, or whose matched entry has no BaseData
- **THEN** the Models, weapon, and ability displays show only the selected entry's own data, unaffected

### Requirement: Weapon Table Model Counts

Each weapon table row SHALL show how many models carry that weapon, read from the entry's own loadout text (its "N×" count), falling back to the attached character's own count for weapons merged in from a leader or support.

#### Scenario: Model count column shown in list view
- **WHEN** the right column renders a selected entry's weapon tables
- **THEN** each row shows the number of models carrying that weapon, as declared in the loadout text (e.g. "6×" for a weapon six models in the squad carry)

#### Scenario: No explicit count in the loadout text
- **WHEN** a loadout text's wargear combo has no leading "N×" count (e.g. a single named model's equipment)
- **THEN** that weapon's model count is shown as 1

#### Scenario: Count missing from a previously-saved list
- **WHEN** a selected entry's wargear token was saved before per-token counts existed and so has no `count` value
- **THEN** that weapon's model count is shown as 1, rather than a blank or broken value

#### Scenario: Model count column absent outside list view
- **WHEN** a unit's datasheet is shown outside of list-view context (e.g. the Process Unit screen), where no army-list loadout text exists
- **THEN** no model-count column is shown

### Requirement: Weapon Table Model Attribution

Each weapon table row SHALL show which unit or character it belongs to, so weapons merged in from an attached leader or support are not confused with the squad's own.

#### Scenario: Own-unit weapons attributed to the selected entry
- **WHEN** the right column renders the selected entry's own weapon tables, with no leader/support merge involved
- **THEN** every row's attribution column shows the selected entry's own unit name

#### Scenario: Merged-in weapons attributed to the attached character
- **WHEN** a weapon row comes from an attached leader/support character (per the Combined Leader/Support Datasheet requirement)
- **THEN** that row's attribution column shows the attached character's own unit name, not the squad's

#### Scenario: Attribution column absent outside list view
- **WHEN** a unit's datasheet is shown outside of list-view context (e.g. the Process Unit screen)
- **THEN** no attribution column is shown

### Requirement: GAME Tab Shows the List-View Screen

The GAME tab SHALL let the user pick one of their saved lists and open the list-view screen for it, replacing the previous attacker/defender unit picker.

#### Scenario: Picking a list from the GAME tab
- **WHEN** the user is on the GAME tab and selects one of their saved lists
- **THEN** the list-view screen opens for that list, identical to opening it from the LIST tab

#### Scenario: Returning to the picker
- **WHEN** the user navigates back from the list-view screen opened via the GAME tab
- **THEN** they return to the GAME tab's list picker, not the LIST tab
