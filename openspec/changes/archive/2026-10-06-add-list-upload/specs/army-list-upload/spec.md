# Spec Delta

## Purpose

Lets the user paste a 40k.app army list text export into the LIST tab, parses it into a structured list, validates its units and weapons against the catalogue already stored in IndexedDB, and persists the result so it can be reviewed or deleted later.

## ADDED Requirements

### Requirement: Paste Input

The LIST tab SHALL provide a text area where the user can paste a 40k.app army list export, and a button to submit it for parsing and validation.

#### Scenario: User pastes a list
- **WHEN** the user pastes text into the LIST tab's input and submits it
- **THEN** the text is parsed per the List Parsing requirement and the result is stored per the Storage Regardless of Validation Outcome requirement

#### Scenario: Empty input
- **WHEN** the user submits with no text pasted
- **THEN** no list is parsed or stored, and the submit action has no effect

### Requirement: List Parsing

The system SHALL parse a pasted 40k.app army list export into: a title, a faction, a free-text army name, a free-text detachment name, a mission, a declared points total, an export list URL (if present), and one entry per unit block.

#### Scenario: Header line parsed
- **WHEN** the pasted text's second line has the form `<Faction> · <army name> · <detachment>`
- **THEN** the parsed list's faction, army name, and detachment are set from that line's three segments respectively

#### Scenario: Unit entry parsed
- **WHEN** a `## <category> [<points> pts]` section contains a `**<unit name>** [<points> pts] (<N> models)` block
- **THEN** an entry is created with that category, unit name, points, and model count
- **AND** any subsequent `- Attached to <name>`, `- Led by <name>`, `- Supported by <name>`, or `- Enhancement: <name> (+<points> pts)` lines belonging to that block are captured on the entry as free text
- **AND** the block's wargear line (if present) is captured on the entry as free text

#### Scenario: List URL captured
- **WHEN** the pasted text's footer contains a 40k.app list URL (e.g. `https://www.40k.app/lists/<id>`)
- **THEN** that URL is stored on the parsed list as its external list URL

### Requirement: Unit Name Validation

Each parsed entry's unit name SHALL be checked against the units known for the parsed list's faction in IndexedDB, and marked as matched or unmatched.

#### Scenario: Unit name matches catalogue
- **WHEN** an entry's unit name exactly matches (case-insensitive) a unit's name for the parsed faction in the IndexedDB `units` store
- **THEN** the entry is marked as a matched unit, recording that unit's slug

#### Scenario: Unit name does not match catalogue
- **WHEN** an entry's unit name has no match among the parsed faction's units
- **THEN** the entry is marked as an unmatched unit
- **AND** parsing continues with the remaining entries in the list

### Requirement: Weapon Name Validation

For each matched entry, the wargear line SHALL be tokenized into individual weapon/wargear names and each token checked against that unit's known wargear catalogue, when available.

#### Scenario: Tokenizing a wargear line
- **WHEN** an entry's wargear line is parsed
- **THEN** it is split on `/` into groups, each group split on `+` into individual wargear names, with any leading `N×` count prefix stripped from each name
- **AND** the count prefixes themselves are not validated

#### Scenario: Wargear token matches catalogue
- **WHEN** a wargear token's name matches (case-insensitive) a `wargearItem.name` or weapon profile name in the matched unit's `unitData.wargear` for its faction
- **THEN** that token is marked as a matched weapon

#### Scenario: Wargear token unverified — unit not yet processed
- **WHEN** a matched entry's unit has no `unitData` record in IndexedDB for the parsed faction
- **THEN** every wargear token for that entry is marked as unverified rather than failed

#### Scenario: Wargear token does not match catalogue
- **WHEN** the matched unit has a `unitData` record and a wargear token's name has no match in its wargear catalogue
- **THEN** that token is marked as an unmatched weapon

#### Scenario: Unmatched unit skips weapon validation
- **WHEN** an entry's unit name is unmatched
- **THEN** its wargear tokens are not validated and are marked unverified

### Requirement: Unvalidated Fields Preserved Verbatim

The parsed list's detachment, and each entry's enhancement text and attached-to/led-by/supported-by text, SHALL be stored verbatim without validation against any catalogue.

#### Scenario: Detachment stored without validation
- **WHEN** a list is parsed with a detachment name in its header line
- **THEN** that detachment name is stored on the list unchanged, with no pass/fail/unverified flag

#### Scenario: Enhancement and attachment text stored without validation
- **WHEN** an entry has an `- Enhancement: ...` line and/or an `- Attached to ...` / `- Led by ...` / `- Supported by ...` line
- **THEN** that text is stored on the entry unchanged, with no pass/fail/unverified flag

### Requirement: Storage Regardless of Validation Outcome

A parsed list SHALL be stored in IndexedDB whether or not all of its entries' units and weapons matched the catalogue, with per-entry and per-wargear-token match flags preserved.

#### Scenario: List with unmatched entries is still stored
- **WHEN** a pasted list has one or more unmatched units or unmatched/unverified weapon tokens
- **THEN** the list is stored in IndexedDB with those entries and tokens flagged as unmatched or unverified
- **AND** entries and tokens that did match are flagged as matched

### Requirement: Multiple Saved Lists with URL-Based Dedupe

The system SHALL support storing more than one parsed list at a time, and SHALL update an existing stored list in place, rather than creating a duplicate, when a newly pasted list's export list URL matches an already-stored list's URL.

#### Scenario: New list URL creates a new saved list
- **WHEN** a pasted list's export list URL does not match any stored list's URL (or no stored list has a URL to compare)
- **THEN** a new list record is created in IndexedDB

#### Scenario: Matching list URL updates the existing saved list
- **WHEN** a pasted list's export list URL matches a stored list's URL
- **THEN** that stored list's record is replaced with the newly parsed result instead of creating a second record

### Requirement: View and Delete Saved Lists

The LIST tab SHALL display all saved lists and allow the user to delete any of them.

#### Scenario: Saved lists are listed
- **WHEN** the user is on the LIST tab and one or more lists are stored in IndexedDB
- **THEN** each stored list is displayed, including its title, faction, and per-entry validation status

#### Scenario: Deleting a saved list
- **WHEN** the user deletes a saved list from the LIST tab
- **THEN** that list's record is removed from IndexedDB and it no longer appears in the LIST tab
