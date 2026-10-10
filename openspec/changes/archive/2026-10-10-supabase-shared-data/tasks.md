# Tasks

## 1. Supabase Schema and Seed

- [x] 1.1 Create SQL migration script (`data/supabase_schema.sql`) with the 4 tables: `factions` (slug PK, name, category, icon, unit_count), `units` (faction_slug + slug composite PK, name, category, points, keywords text[]), `base_data` (faction_slug + unit_slug composite PK, data JSONB), `unit_data` (faction_slug + unit_slug composite PK, tag text, abilities JSONB, raw_abilities JSONB, base_data_hash text). Verify by running the SQL against the Supabase project — all 4 tables created without errors.
- [x] 1.2 Create a seed script (`data/seed_supabase.py`) that reads `data/space-marines/BaseData/*.json` and `data/space-marines/units.json`, and upserts them into the Supabase `factions`, `units`, and `base_data` tables. Verify by running the script and confirming row counts match the local file count.
- [x] 1.3 If structured abilities data exists locally (e.g., from previous AI proposals or confirmed data), extend the seed script to also upload `unit_data` rows. Verify by querying `unit_data` in Supabase and confirming records exist with correct tags.

## 2. Supabase Client Module

- [x] 2.1 Install `@supabase/supabase-js` in `app/`. Verify with `npm ls @supabase/supabase-js`.
- [x] 2.2 Create `app/src/data/supabase.ts` with: singleton client initialization from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, an `isSupabaseConfigured()` check, and typed CRUD functions for each table (fetchFactions, fetchUnitsByFaction, fetchBaseData, upsertBaseData, fetchUnitData, upsertUnitData, upsertUnit, upsertFaction). Verify by importing the module and confirming TypeScript compiles without errors (`npm run build`).
- [x] 2.3 Add `.env.example` with `VITE_SUPABASE_URL=` and `VITE_SUPABASE_ANON_KEY=` placeholders. Add `.env` to `.gitignore` if not already present. Verify the file exists and `.env` is gitignored.

## 3. Refactor db.ts Write Functions

- [x] 3.1 Refactor `putBaseData` to write to Supabase first (via `supabase.ts`), then update IndexedDB on success. When Supabase is not configured, write to IndexedDB only (fallback mode). Verify with existing `uploadFlow.test.ts` tests passing (they use fake-indexeddb, which is IDB-only — they should still pass in fallback mode).
- [x] 3.2 Refactor `putStructuredAbilitiesData` to write to Supabase first, then update IndexedDB. Verify with existing `db.test.ts` tests passing.
- [x] 3.3 Refactor `putUnit` and `syncUnitCatalog` to write to Supabase first, then update IndexedDB. Verify with existing tests passing.
- [x] 3.4 Add unit tests for the Supabase-first write path: mock `supabase.ts` functions, verify that on Supabase success IDB is updated, and on Supabase failure IDB is not updated and the error propagates. Verify tests pass with `npm run test`.

## 4. Refactor db.ts Read Functions with Stale-While-Revalidate

- [x] 4.1 Refactor `getAllFactions` to return IDB data immediately, then trigger a background Supabase fetch that updates IDB if data differs. Verify by reading factions — returns cached data instantly, and after revalidation IDB contains Supabase data.
- [x] 4.2 Refactor `getUnitsByFaction`, `getBaseData`, `getStructuredAbilitiesData`, and count functions (`getBaseDataCount`, `getConfirmedUnitDataCount`, `getUnitStatuses`) to follow the same stale-while-revalidate pattern. Verify existing tests still pass.
- [x] 4.3 For cache-miss reads (IDB empty), fetch from Supabase synchronously (await), store in IDB, then return. Verify by clearing IDB and reading — data comes from Supabase.
- [x] 4.4 Add unit tests for stale-while-revalidate behavior: mock Supabase responses, verify IDB is updated after background fetch. Verify tests pass.

## 5. Replace Static Seed with Supabase Init

- [x] 5.1 Refactor `loadCatalog.ts`: when Supabase is configured, fetch factions from Supabase instead of `/data/units.json`. When Supabase is not configured, fall back to the static JSON (existing behavior). Verify by running the app with Supabase env vars — no fetch to `/data/units.json` occurs, factions load from Supabase.
- [x] 5.2 Update `UploadModal.tsx` — the commit phase now calls the refactored `putUnit` + `putBaseData` + `putStructuredAbilitiesData` which go through Supabase. No direct IDB writes. Verify by uploading a BaseData file and confirming the record appears in Supabase.
- [x] 5.3 Update `ProposalsImportModal.tsx` — import flow now calls the refactored `putStructuredAbilitiesData`. Verify by importing a proposals file and confirming records appear in Supabase.
- [x] 5.4 Update `ProcessUnitView.tsx` — save and confirm actions now call the refactored `putStructuredAbilitiesData`. Verify by confirming a unit and checking the record in Supabase has `tag: CONFIRMED`.

## 6. Integration Verification

- [x] 6.1 Run full test suite (`npm run test`) — all existing tests pass. The test environment uses `fake-indexeddb` and no Supabase env vars, so tests run in fallback mode (IDB-only).
- [x] 6.2 Run `npm run build` — TypeScript compiles and production build succeeds with no errors.
- [x] 6.3 Run `npm run lint` — no new linting issues.
- [ ] 6.4 Manual end-to-end verification (requires Supabase credentials): start dev server with Supabase env vars, upload BaseData for a unit, confirm structured abilities, verify data persists after clearing IndexedDB and reloading the page (data comes back from Supabase).

## Workflow follow-up

- Archive the change after verifying the integration works end-to-end.
- Update `openspec/config.yaml` context to reflect that the app now uses Supabase as a backend for shared data.
