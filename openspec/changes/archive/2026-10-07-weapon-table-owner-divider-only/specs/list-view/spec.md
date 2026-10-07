# Spec Delta

## MODIFIED Requirements

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

#### Scenario: Attribution cell visually distinct from the weapon name
- **WHEN** a weapon table row's attribution column is rendered
- **THEN** its text color is visually distinct from the weapon name cell next to it

#### Scenario: Divider is the only visible row-separator in a weapon table
- **WHEN** a weapon table (Ranged Weapons or Melee Weapons) renders consecutive rows attributed to the same unit or character, including a weapon's own stat row followed by its ability-chip row
- **THEN** no horizontal line separates those rows — not between a weapon's stat row and its own ability-chip row, and not between two different weapons belonging to the same unit or character

#### Scenario: Divider only at an ownership boundary
- **WHEN** a weapon table has consecutive rows attributed to the same unit or character, followed by one or more rows attributed to a different unit or character (e.g. rows 1-2 belong to the squad and row 3 belongs to an attached leader)
- **THEN** a horizontal divider is drawn only between the last row of one owner (whichever row that is — a stat row or an ability-chip row) and the first row of the next, and that divider is the only horizontal line visible anywhere in the table
