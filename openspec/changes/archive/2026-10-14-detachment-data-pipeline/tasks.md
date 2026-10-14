# Tasks

## 1. Supabase Table & TypeScript Types

- [x] 1.1 Create the `detachment_data` table in Supabase with columns `faction_slug` (text), `detachment_slug` (text), `tag` (text), `data` (JSONB), `enhancements` (JSONB nullable), PK `(faction_slug, detachment_slug)`. Verify by querying the table schema in the Supabase dashboard.
- [x] 1.2 Add TypeScript types to `app/src/data/schema.ts`: `StructuredEnhancement` (with `slug`, `name`, `points`, `enhancementType`, `limit`, `eligibility`, `effects: Effect[]`, `conditionalEffects`, `originalText`), `DetachmentData` (with `tag`, `data`, `enhancements`), and backup types `FactionBackupDetachmentData`. Verify with `npm run build` passing.
- [x] 1.3 Add Supabase client functions to `app/src/data/supabase.ts`: `DetachmentDataRow` interface, `fetchDetachmentsByFaction`, `fetchDetachmentData`, `upsertDetachmentData`, `fetchAllDetachmentDataByFaction`. Verify with `npm run build` passing and functions matching the existing pattern (getClient guard, error handling).

## 2. Scraper & Seed Script

- [x] 2.1 Run `fetch_faction_data.py --all` to scrape detachment data for all factions. Verify that each faction directory contains a `faction_data.json` with a non-empty `detachments` array.
- [x] 2.2 Extend `seed_supabase.py` with a `seed_detachments` function that reads `faction_data.json` and optional `enhancement_proposals.json`, upserts rows into `detachment_data` with appropriate tags (`SCRAPED` when no structured enhancements, `AI_PROPOSED` when present), and respects CONFIRMED rows unless `--override-confirmed`. Verify by running `seed_supabase.py "Space Marines"` and checking rows appear in Supabase.

## 3. AI Enhancement Structuring Script

- [x] 3.1 Create `data/auto_structure_enhancements.py` following the `auto_structure.py` pattern: Bedrock/API client setup, `EFFECT_SCHEMA` prompt definition, batch processing per detachment. Accept `<faction-name>` and optional `--detachment <slug>` arguments. Verify the script runs without error on a test detachment.
- [x] 3.2 Define the Claude prompt that maps enhancement rules text to `Effect[]` and `conditionalEffects[]`, including the full Effect schema, 3-4 example mappings from Space Marines enhancements, and instructions for handling unstructurable rules as OTHER entries. Verify by running for one Space Marines detachment and inspecting the output structure matches `StructuredEnhancement`.
- [x] 3.3 Write output to `<faction-slug>/enhancement_proposals.json` keyed by `<faction-slug>/<detachment-slug>`. Verify the file is created and parseable, and that re-running with `--detachment` updates only the targeted entry.

## 4. Backup Extension

- [x] 4.1 Add `detachmentData` field to `FactionBackup` interface in `schema.ts` and update `exportFactionBackup` in `backup.ts` to fetch and include detachment data. Verify by exporting a Space Marines backup and confirming the JSON contains a `detachmentData` array.
- [x] 4.2 Update `importFactionBackup` in `backup.ts` to upsert detachment data from the backup, treating missing `detachmentData` as empty array for backward compatibility. Verify by importing a backup file (both with and without `detachmentData`) without errors.
- [x] 4.3 Update the `validateBackupFile` function and the upload confirmation dialog in the UI to show detachment count. Verify the confirmation dialog displays the detachment entry count.

## 5. Detachment Browse UI

- [x] 5.1 Add a detachments section to the faction detail view (in `HomeView.tsx` or as a new `DetachmentsView.tsx`) that fetches and lists all detachments for the selected faction showing name, points cost, enhancement/stratagem counts, and tag badge. Verify by navigating to a faction with seeded detachment data and seeing the list.
- [x] 5.2 Handle the empty state when no detachment data exists for a faction. Verify by navigating to a faction without detachment data and seeing the empty state message.

## 6. Detachment Enhancement Review UI

- [x] 6.1 Create a `DetachmentDetailView.tsx` component that displays the detachment rule (formatted HTML), stratagems list (formatted HTML), and enhancements with their structured effects. Reuse `FormattedAbilityText` for HTML rendering. Verify by navigating to a detachment and seeing all three sections.
- [x] 6.2 Wire up the enhancement effect editor using the same editor components from `ProcessUnitView.tsx` (effect category selector, stat/weapon/dice modifier editors). Allow adding, removing, and editing effects per enhancement. Verify by editing an enhancement's effects and seeing the changes reflected.
- [x] 6.3 Implement save functionality that upserts the edited detachment data to Supabase with `tag: "CONFIRMED"`. Verify by saving edits and confirming the tag updates in Supabase. Run `npm run build` and `npm run lint` to confirm no regressions.

## Workflow follow-up

- Archive the change after all tasks are complete and reviewed.
- Sync delta specs to main specs after archive.
