# Spec Delta

## Purpose

Enables downloading a complete backup of a faction's data (units, base data, structured abilities, loadout) as a single JSON file, and restoring it by uploading that file back.

## ADDED Requirements

### Requirement: Backup JSON Format

The backup file SHALL be a JSON object with fields: `format` (literal `"40ksim-faction-backup"`), `version` (integer `1`), `factionSlug` (string), `exportedAt` (ISO 8601 timestamp), `units` (array of unit records), `baseData` (array of `{unitSlug, data}`), `unitData` (array of `{unitSlug, tag, abilities, rawAbilities, baseDataHash}`), and `loadoutData` (array of `{unitSlug, tag, options}`).

#### Scenario: Valid backup file structure
- **WHEN** a backup file is generated
- **THEN** it SHALL contain all required fields with the correct types and the `format` field set to `"40ksim-faction-backup"`

#### Scenario: Empty arrays for missing data
- **WHEN** a faction has no loadout data or no structured abilities for some units
- **THEN** those arrays SHALL be present but may be empty or contain fewer entries than the units array

### Requirement: Download Faction Backup

The faction detail view SHALL display a download button that exports the current faction's complete data as a backup JSON file named `<faction-slug>-backup.json`.

#### Scenario: Downloading a backup
- **WHEN** the user clicks the download button on a faction's unit list
- **THEN** the app SHALL fetch all units, base data, unit data, and loadout data for that faction from Supabase and trigger a browser file download with the backup JSON

#### Scenario: Download with no data
- **WHEN** the user clicks download for a faction with no base data or unit data
- **THEN** the backup file SHALL still be generated with empty arrays for the missing data types

### Requirement: Upload Faction Backup

The faction detail view SHALL display an upload button that accepts a backup JSON file and restores its data into Supabase.

#### Scenario: Restoring a backup
- **WHEN** the user selects a valid backup JSON file via the upload button
- **THEN** the app SHALL upsert all units, base data, unit data, and loadout data from the file into Supabase for the matching faction

#### Scenario: Faction mismatch validation
- **WHEN** the user uploads a backup file whose `factionSlug` does not match the currently viewed faction
- **THEN** the app SHALL show an error and NOT import any data

#### Scenario: Invalid file format
- **WHEN** the user uploads a file that is not valid JSON or lacks the `format: "40ksim-faction-backup"` field
- **THEN** the app SHALL show an error and NOT import any data

### Requirement: Upload Confirmation

Before restoring, the app SHALL show a summary of what will be imported (number of units, base data entries, unit data entries, loadout entries) and require the user to confirm.

#### Scenario: Confirmation dialog
- **WHEN** a valid backup file is selected
- **THEN** the app SHALL display a confirmation dialog showing the counts of records to import and the export timestamp
- **AND** the import SHALL proceed only after the user confirms

### Requirement: Upload Progress Feedback

During the restore process, the app SHALL show progress feedback since upserting many records can take several seconds.

#### Scenario: Progress during restore
- **WHEN** the restore is in progress
- **THEN** the app SHALL display a loading indicator or progress message
- **AND** the upload button SHALL be disabled until the restore completes
