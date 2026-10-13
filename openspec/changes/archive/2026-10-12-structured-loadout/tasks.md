# Tasks

## 1. TypeScript Schema & Supabase Table

- [x] 1.1 Add `StructuredLoadoutData`, `WargearOption`, `WargearChoice`, `WargearScope`, and `WargearRef` interfaces to `app/src/data/schema.ts` following the design doc shapes. Verify: `npm run build` passes with the new types.
- [x] 1.2 Create `loadout_data` table in Supabase with columns `faction_slug` (text), `unit_slug` (text), `tag` (text), `options` (JSONB), PK `(faction_slug, unit_slug)`. Verify: table exists and accepts an upsert via Supabase dashboard or `psql`.
- [x] 1.3 Add `fetchLoadoutData`, `upsertLoadoutData`, `fetchAllLoadoutDataByFaction` functions to `app/src/data/supabase.ts` mirroring the `unitData` pattern. Verify: `npm run build` passes.
- [x] 1.4 Add `loadoutData` object store to IndexedDB in `app/src/data/db.ts` (keyed by `[faction_slug, unit_slug]`) with `getLoadoutData` and `putLoadoutData` functions using Supabase-first writes. Verify: `npm run build` passes and the store is created on app launch.

## 2. Python AI Structuring Script

- [x] 2.1 Create `data/auto_loadout.py` that reads `wargearRules` and `wargear` from BaseData, builds a prompt with the `WargearOption` schema and wargear catalogue (id + name pairs), calls Claude API, and writes `loadout_proposals.json`. Support `--unit` flag for single-unit mode. Verify: run `python data/auto_loadout.py "Space Marines" --unit captain` and confirm the output JSON contains valid `WargearOption[]` with correct `wargearItemId` references.
- [x] 2.2 Extend `data/seed_supabase.py` to read `loadout_proposals.json` (when present) and upsert rows into `loadout_data` with `tag: AI_PROPOSED`. Verify: run seed for a faction and confirm rows appear in Supabase `loadout_data` table.

## 3. Process Unit Loadout Section

- [x] 3.1 Add state management for loadout data in `ProcessUnitView.tsx`: load `loadout_data` on mount (from IndexedDB with Supabase revalidation), track per-option approve/reject decisions in local state. Verify: `npm run build` passes.
- [x] 3.2 Render "Opciones de Loadout" section below abilities review. Each option shows: the `originalText` as a read-only block, then the structured fields (scope, replaces, choices) in a summary view, with "Aprobar"/"Rechazar" buttons. Section hidden when no loadout data exists. Verify: open Process Unit for a unit with AI_PROPOSED loadout data and confirm each rule displays original text above the structured proposal.
- [x] 3.3 Implement "Guardar Loadout" button: enabled only when all options are decided; writes approved options to Supabase `loadout_data` with `tag: CONFIRMED`, then updates IndexedDB. Verify: approve/reject rules, save, reload — confirmed loadout persists with correct tag.

## 4. Integration Verification

- [ ] 4.1 End-to-end flow: run `auto_loadout.py` for a faction, seed to Supabase, open Process Unit in the app, review loadout rules, save. Verify: loadout_data in Supabase has tag CONFIRMED with only approved options. Abilities workflow unaffected.
- [x] 4.2 Verify `npm run build` and `npm run lint` pass with all changes.

## Workflow follow-up

- Archive the change after review with `/opsx:archive`.
