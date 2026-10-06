# Spec Delta

## ADDED Requirements

### Requirement: Parent Faction Resolution

A faction SHALL be treated as having a parent faction when another faction shares its `category` and that other faction's own name equals the category string. A faction with no such match SHALL have no parent.

#### Scenario: Chapter faction resolves to its parent
- **WHEN** resolving the parent of a faction whose `category` is some value `<category>`
- **AND** another faction's own name equals `<category>`
- **THEN** that other faction is the parent of the first faction

#### Scenario: Faction has no parent
- **WHEN** no other faction's name equals the faction's own `category` (or the faction has no `category`)
- **THEN** the faction has no parent

## MODIFIED Requirements

### Requirement: Unit Name Validation

Each parsed entry's unit name SHALL be checked against the units known for the parsed list's faction in IndexedDB, falling back to that faction's parent faction (per Parent Faction Resolution) when there is no match among the faction's own units, and marked as matched or unmatched.

#### Scenario: Unit name matches catalogue
- **WHEN** an entry's unit name exactly matches (case-insensitive) a unit's name for the parsed faction in the IndexedDB `units` store
- **THEN** the entry is marked as a matched unit, recording that unit's slug and the parsed faction as the faction it was matched under

#### Scenario: Unit name matches only in the parent faction
- **WHEN** an entry's unit name has no match among the parsed faction's own units
- **AND** the parsed faction has a parent faction, and the unit name matches a unit there
- **THEN** the entry is marked as a matched unit, recording that unit's slug and the parent faction as the faction it was matched under

#### Scenario: Unit name does not match catalogue
- **WHEN** an entry's unit name has no match among the parsed faction's own units
- **AND** either the parsed faction has no parent, or the unit name has no match among the parent faction's units either
- **THEN** the entry is marked as an unmatched unit
- **AND** parsing continues with the remaining entries in the list

### Requirement: Weapon Name Validation

For each matched entry, the wargear line SHALL be tokenized into individual weapon/wargear names and each token checked against the matched unit's known wargear catalogue, read from whichever faction (the entry's own faction, or its parent) the unit was actually matched under.

#### Scenario: Tokenizing a wargear line
- **WHEN** an entry's wargear line is parsed
- **THEN** it is split on `/` into groups, each group split on `+` into individual wargear names, with any leading `N×` count prefix stripped from each name
- **AND** the count prefixes themselves are not validated

#### Scenario: Wargear token matches catalogue
- **WHEN** a wargear token's name matches (case-insensitive) a `wargearItem.name` or weapon profile name in the matched unit's `unitData.wargear`, read from the faction the unit was matched under
- **THEN** that token is marked as a matched weapon

#### Scenario: Wargear token matched via the parent faction's unitData
- **WHEN** an entry's unit was matched under its parent faction (per Unit Name Validation)
- **AND** that parent faction has a `unitData` record for the unit
- **THEN** the entry's wargear tokens are checked against that parent faction's `unitData.wargear`, exactly as they would be against the entry's own faction

#### Scenario: Wargear token unverified — unit not yet processed
- **WHEN** a matched entry's unit has no `unitData` record in IndexedDB for the faction it was matched under
- **THEN** every wargear token for that entry is marked as unverified rather than failed

#### Scenario: Wargear token does not match catalogue
- **WHEN** the faction the unit was matched under has a `unitData` record for it, and a wargear token's name has no match in its wargear catalogue
- **THEN** that token is marked as an unmatched weapon

#### Scenario: Unmatched unit skips weapon validation
- **WHEN** an entry's unit name is unmatched
- **THEN** its wargear tokens are not validated and are marked unverified
