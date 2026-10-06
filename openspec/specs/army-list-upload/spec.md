# Army List Upload Specification

## Purpose

Lets the user paste a 40k.app army list text export into the LIST tab, parses it into a structured list, validates its units and weapons against the catalogue already stored in IndexedDB, and persists the result so it can be reviewed or deleted later.

## Requirements

### Requirement: Paste Input

The LIST tab SHALL provide a text area where the user can paste a 40k.app army list export, and a button to submit it for parsing and validation.

#### Scenario: User pastes a list
- **WHEN** the user pastes text into the LIST tab's input and submits it
- **THEN** the text is parsed per the List Parsing requirement and the result is stored per the Storage Regardless of Validation Outcome requirement

#### Scenario: Empty input
- **WHEN** the user submits with no text pasted
- **THEN** no list is parsed or stored, and the submit action has no effect

### Requirement: List Parsing

The system SHALL parse a pasted 40k.app army list export into: a title, a faction, a free-text army name, a free-text detachment name, a mission, a declared points total, an export list URL (if present), and one entry per unit block. The export has no markdown decoration; hierarchy is conveyed by indentation depth alone: category headers are unindented, each unit entry's own line is indented one level deeper than its category header, and a unit entry's sub-lines (Attached to/Led by/Supported by/Enhancement/wargear) are indented one level deeper still.

#### Scenario: Header line parsed
- **WHEN** the pasted text's second line has the form `<Faction> · <army name> · <detachment>`
- **THEN** the parsed list's faction, army name, and detachment are set from that line's three segments respectively

#### Scenario: Category header parsed
- **WHEN** an unindented line has the form `<CATEGORY NAME> [<points> pts]`
- **THEN** subsequent unit entries are associated with that category, until the next category header

#### Scenario: Unit entry parsed
- **WHEN** a line indented one level deeper than its category header has the form `<unit name> [<points> pts]`, optionally followed by ` (<N> models)`
- **THEN** an entry is created under the current category, with that unit name, points, and model count
- **AND** any subsequent sub-line reading `Attached to <name>`, `Led by <name>`, `Supported by <name>`, or `Enhancement: <name> (+<points> pts)` belonging to that entry is captured on the entry as free text
- **AND** the entry's wargear sub-line (if present) is captured on the entry as free text

#### Scenario: List URL captured
- **WHEN** the pasted text's footer contains a 40k.app list URL (e.g. `https://www.40k.app/lists/<id>`), whether inline or on its own line
- **THEN** that URL is stored on the parsed list as its external list URL

### Requirement: Parent Faction Resolution

A faction SHALL be treated as having a parent faction when another faction shares its `category` and that other faction's own name equals the category string. A faction with no such match SHALL have no parent.

#### Scenario: Chapter faction resolves to its parent
- **WHEN** resolving the parent of a faction whose `category` is some value `<category>`
- **AND** another faction's own name equals `<category>`
- **THEN** that other faction is the parent of the first faction

#### Scenario: Faction has no parent
- **WHEN** no other faction's name equals the faction's own `category` (or the faction has no `category`)
- **THEN** the faction has no parent

### Requirement: Unit Name Validation

Each parsed entry's unit name SHALL be checked against the uploaded BaseData records' names for the parsed list's faction, falling back to that faction's parent faction (per Parent Faction Resolution) when there is no match among the faction's own BaseData, and marked as matched or unmatched.

#### Scenario: Unit name matches an uploaded BaseData record
- **WHEN** an entry's unit name exactly matches (case-insensitive) the `name` of a BaseData record uploaded for the parsed faction
- **THEN** the entry is marked as a matched unit, recording that BaseData record's slug and the parsed faction as the faction it was matched under

#### Scenario: Unit name matches only in the parent faction
- **WHEN** an entry's unit name has no match among the parsed faction's own BaseData records
- **AND** the parsed faction has a parent faction, and the unit name matches a BaseData record's `name` there
- **THEN** the entry is marked as a matched unit, recording that BaseData record's slug and the parent faction as the faction it was matched under

#### Scenario: Unit name does not match any uploaded BaseData
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

The LIST tab SHALL display all saved lists as a table — one row per list, ordered by most recent upload first — with columns for upload date, name, faction, detachment, and declared points, and SHALL allow the user to delete any row. Importing a new list SHALL be triggered from a "+" button above the table rather than an always-visible input.

#### Scenario: Saved lists are listed
- **WHEN** the user is on the LIST tab and one or more lists are stored in IndexedDB
- **THEN** each stored list appears as a row showing its upload date, name (its parsed army name), faction, detachment, and declared points
- **AND** rows are ordered by upload date, most recent first

#### Scenario: Import triggered from the "+" button
- **WHEN** the user clicks the "+" button above the saved lists table
- **THEN** the paste-and-submit import input (per the Paste Input requirement) is presented, and submitting it adds or updates a row in the table as usual

#### Scenario: Deleting a saved list
- **WHEN** the user clicks a row's delete button
- **THEN** that list's record is removed from IndexedDB and its row no longer appears in the table

### Requirement: Open List Detail From Saved Lists Table

Selecting a saved list's row SHALL open the list-view screen for that list.

#### Scenario: Selecting a row opens the detail screen
- **WHEN** the user clicks a saved list's row, other than its delete button
- **THEN** the list-view screen opens for that list

#### Scenario: Back returns to the table
- **WHEN** the user navigates back from the list-view screen opened from the LIST tab
- **THEN** the saved lists table is shown again

### Requirement: Upload Timestamp Tracking

Each stored list SHALL carry an upload timestamp that is set to the current time whenever the list is saved, including when an existing list is replaced in place via URL-based dedupe, so the timestamp always reflects the most recent upload rather than the first one.

#### Scenario: New list records its upload time
- **WHEN** a newly parsed list is stored because no existing list matched its URL
- **THEN** its record's upload timestamp is set to the current time

#### Scenario: Dedupe update refreshes the upload time
- **WHEN** a newly parsed list's URL matches an already-stored list's URL and that stored record is replaced in place
- **THEN** the replaced record's upload timestamp is set to the current time, not the original record's timestamp
