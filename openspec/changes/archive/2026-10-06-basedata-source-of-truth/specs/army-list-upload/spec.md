# Spec Delta

## MODIFIED Requirements

### Requirement: Unit Name Validation

Each parsed entry's unit name SHALL be checked against the uploaded BaseData records' names for the parsed list's faction, falling back to that faction's parent faction (per Parent Faction Resolution) when there is no match among the faction's own BaseData, and marked as matched or unmatched.

#### Scenario: Unit name matches catalogue
- **WHEN** an entry's unit name exactly matches (case-insensitive) the `name` of a BaseData record uploaded for the parsed faction
- **THEN** the entry is marked as a matched unit, recording that BaseData record's slug and the parsed faction as the faction it was matched under

#### Scenario: Unit name matches only in the parent faction
- **WHEN** an entry's unit name has no match among the parsed faction's own BaseData records
- **AND** the parsed faction has a parent faction, and the unit name matches a BaseData record's `name` there
- **THEN** the entry is marked as a matched unit, recording that BaseData record's slug and the parent faction as the faction it was matched under

#### Scenario: Unit name does not match catalogue
- **WHEN** an entry's unit name has no match among the parsed faction's own BaseData records
- **AND** either the parsed faction has no parent, or the unit name has no match among the parent faction's BaseData records either
- **THEN** the entry is marked as an unmatched unit
- **AND** parsing continues with the remaining entries in the list

### Requirement: Weapon Name Validation

For each matched entry, the wargear line SHALL be tokenized into individual weapon/wargear names and each token checked against the matched unit's wargear catalogue derived live from its BaseData, read from whichever faction (the entry's own faction, or its parent) the unit was actually matched under.

#### Scenario: Tokenizing a wargear line
- **WHEN** an entry's wargear line is parsed
- **THEN** it is split on `/` into groups, each group split on `+` into individual wargear names, with any leading `N×` count prefix stripped from each name
- **AND** the count prefixes themselves are not validated

#### Scenario: Wargear token matches catalogue
- **WHEN** a wargear token's name matches (case-insensitive) a `wargearItem.name` or weapon profile name in the wargear catalogue derived from the matched unit's BaseData, read from the faction the unit was matched under
- **THEN** that token is marked as a matched weapon

#### Scenario: Wargear token matched via the parent faction's unitData
- **WHEN** an entry's unit was matched under its parent faction (per Unit Name Validation)
- **AND** that parent faction has a BaseData record for the unit
- **THEN** the entry's wargear tokens are checked against the wargear catalogue derived from that parent faction's BaseData, exactly as they would be against the entry's own faction

#### Scenario: Wargear token unverified — unit not yet processed
- **WHEN** a matched entry's unit has no BaseData record in IndexedDB for the faction it was matched under
- **THEN** every wargear token for that entry is marked as unverified rather than failed

#### Scenario: Wargear token does not match catalogue
- **WHEN** the faction the unit was matched under has a BaseData record for it, and a wargear token's name has no match in its BaseData-derived wargear catalogue
- **THEN** that token is marked as an unmatched weapon

#### Scenario: Unmatched unit skips weapon validation
- **WHEN** an entry's unit name is unmatched
- **THEN** its wargear tokens are not validated and are marked unverified
