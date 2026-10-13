# Tasks

## 1. Backup Format and Export Logic

- [x] 1.1 Add `FactionBackup` interface to `app/src/data/schema.ts` with fields: `format`, `version`, `factionSlug`, `exportedAt`, `units`, `baseData`, `unitData`, `loadoutData`. Verify: `npm run build` passes.
- [x] 1.2 Create `app/src/data/backup.ts` with `exportFactionBackup(factionSlug)` that fetches all data via existing Supabase functions, assembles the `FactionBackup` object, and triggers a browser download of `<faction-slug>-backup.json`. Verify: `npm run build` passes.

## 2. Restore Logic

- [x] 2.1 Add `importFactionBackup(factionSlug, backup)` to `app/src/data/backup.ts` that validates the backup format and faction slug match, then upserts all records (units, baseData, unitData, loadoutData) using existing Supabase functions. Verify: `npm run build` passes.
- [x] 2.2 Add `validateBackupFile(file, expectedFactionSlug)` that parses the JSON, checks `format === "40ksim-faction-backup"` and `factionSlug` match, and returns the parsed backup or an error message. Verify: `npm run build` passes.

## 3. UI Integration

- [x] 3.1 Add a download backup button (Download icon from lucide-react) to the toolbar in `UnitsView.tsx`. On click, call `exportFactionBackup` with the current faction slug. Show a loading state while fetching. Verify: clicking the button triggers a file download.
- [x] 3.2 Add a restore backup button (Upload icon) to the toolbar in `UnitsView.tsx`. On click, open a file picker for `.json` files. Validate the selected file with `validateBackupFile`. Verify: invalid files show an error message.
- [x] 3.3 Show a confirmation modal after successful validation, displaying: faction name, export date, and counts of units/baseData/unitData/loadoutData records. Import proceeds only on confirm. Verify: modal shows correct counts and cancel aborts the import.
- [x] 3.4 During import, show a loading indicator and disable the button. After completion, refresh the units list. Verify: progress feedback is visible during restore and the unit list refreshes after.

## 4. Verification

- [x] 4.1 Verify `npm run build` and `npm run lint` pass with all changes.
