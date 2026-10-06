# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Upload Timestamp Tracking

Each stored list SHALL carry an upload timestamp that is set to the current time whenever the list is saved, including when an existing list is replaced in place via URL-based dedupe, so the timestamp always reflects the most recent upload rather than the first one.

#### Scenario: New list records its upload time
- **WHEN** a newly parsed list is stored because no existing list matched its URL
- **THEN** its record's upload timestamp is set to the current time

#### Scenario: Dedupe update refreshes the upload time
- **WHEN** a newly parsed list's URL matches an already-stored list's URL and that stored record is replaced in place
- **THEN** the replaced record's upload timestamp is set to the current time, not the original record's timestamp
