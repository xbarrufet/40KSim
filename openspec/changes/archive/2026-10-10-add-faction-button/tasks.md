# Tasks

## 1. Seed All Known Factions

- [x] 1.1 Update `data/seed_supabase.py` to seed all 36 factions from `data/factions.json` to Supabase (name, slug, category) even when no local `units.json` exists for them. Factions with existing data are not overwritten. Verify by running `python3 data/seed_supabase.py --all` and confirming all factions exist in Supabase.

## 2. Data Layer

- [x] 2.1 Add `getFactionsWithoutUnits()` function to `db.ts` that fetches all factions from Supabase with unit_count = 0, sorted alphabetically. Verify with `npx tsc -b --noEmit`.
- [x] 2.2 Modify `getAllFactions()` in `db.ts` to filter out factions with unitCount = 0, so the grid only shows factions with data. Verify existing tests still pass.

## 3. UI

- [x] 3.1 Add an "Añadir facción" button in the `page-heading` area of `FactionsView.tsx`. Clicking it opens a modal. Verify the button is visible on the factions screen.
- [x] 3.2 Create the add-faction modal inline in `FactionsView.tsx`: dropdown populated by `getFactionsWithoutUnits()`, file drop zone for units JSON (required), confirm and cancel buttons. Confirm is disabled when no faction is selected or no file is uploaded. Verify the modal opens and fields work.
- [x] 3.3 On confirm, call `syncUnitCatalog` with the selected faction slug and parsed units, then refresh the faction list. On cancel, close the modal. Verify a faction appears in the grid after uploading its units.
- [x] 3.4 Add modal styles to `App.css` reusing the existing `.modal-overlay` and `.modal-content` patterns from the upload modal. Verify the modal looks consistent with existing modals.

## 4. Verification

- [x] 4.1 Run `npm run build` — no errors.
- [x] 4.2 Run `npm run lint` — no new issues.
- [x] 4.3 Run `npm run test` — existing tests pass (no new test regressions).
