# Proposal

## Why

There is no way to back up or restore a faction's processed data (base data, structured abilities, loadout proposals). If Supabase data is lost or overwritten (as happened when `seed_supabase.py` overwrote CONFIRMED abilities), the manual review work is gone. Users need a way to download a complete snapshot of a faction and restore it later.

## What Changes

- **Download button on faction detail view**: Exports a single JSON file containing all unit data for the selected faction: units list, base data, structured abilities (unit_data), and loadout data. The file is named `<faction-slug>-backup.json` and downloaded via the browser.
- **Upload/restore button on faction detail view**: Accepts a backup JSON file and upserts all records back into Supabase, restoring units, base data, unit_data, and loadout_data for that faction.
- **Backup JSON format**: A self-contained JSON with `factionSlug`, `exportedAt` timestamp, and arrays of `units`, `baseData`, `unitData`, and `loadoutData` records.

## Capabilities

### New Capabilities
- `faction-backup`: Covers the backup JSON format, the download (export) flow, and the upload (restore) flow for a faction's complete data set.

### Modified Capabilities
_(none — this is a new standalone feature using existing Supabase functions)_

## Impact

- **App code**: New export/import logic, new buttons in the faction detail view (UnitsView.tsx), new backup format types in schema.ts.
- **Supabase**: No schema changes — uses existing upsert functions.
- **No breaking changes**: Additive feature, no existing behavior modified.
