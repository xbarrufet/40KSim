# Design

## Context

See proposal.md - Why. Relevant current state:

- `UnitData` (app/src/data/schema.ts) currently holds `tag`, `id`, `slug`, `name`, `keywords`, `stats`, `wargear`, `abilities`, `rawAbilities` — stored in IndexedDB's `unitData` store, keyed `"<faction-slug>/<unit-slug>"`.
- `preprocessBaseData(baseData)` (app/src/data/preprocessBaseData.ts) builds a full `UnitData`-shaped object straight from `BaseData`, used both to seed a new `UnitData` record on first upload (`UploadModal.tsx`) and, as of `list-view`, called live with no storage at all (`ListDetailView.tsx`).
- `extractDatasheetContext(baseData)` (same file) independently computes per-miniature stats/costs/composition/ledBy - already has no storage dependency and is unaffected by this change.
- `ProcessUnitView.tsx` loads a unit's stored `UnitData`, lets the user review raw abilities into structured/OTHER/removed, and on save writes the whole thing back with `tag: "CONFIRMED"`. It also renders a "Simulation stats (UnitData)" block showing `draft.stats`/`draft.keywords`, separate from the `UnitDatasheet`-rendered Models table (which already shows the same numbers from BaseData).
- `UploadModal.tsx`'s `handleConfirm` auto-creates a `units` catalog record (`{slug: entry.slug, name: entry.slug, factionSlug, keywords: []}`) when a dropped file's slug matches no existing catalog unit - using the raw filename as `name`, not the BaseData's own `name` field. This is the root cause of the bug found while testing `list-view`: an army-list entry's name text can never match that garbled catalog name.
- `parseArmyList.ts`'s `parseAndValidateArmyList` resolves unit names via `getUnitsByFaction` (the `units` catalog store) and resolves wargear tokens via `getUnitData(...).wargear` - both are the other two legs of the three-record duplication described in the proposal.
- Per `faction-unit-browser`'s existing spec, the `units` catalog is deliberately seeded empty (`data/build_seed.py` only writes factions) - units only ever come into existence via BaseData upload. So "match against the units catalog" and "match against uploaded BaseData" are already meant to describe the same set of units; the catalog is just an unreliable proxy for it today.
- `list-view`'s `ListDetailView`/`UnitDatasheet` never read `UnitData` at all already - they are unaffected by this change except that `matchLoadoutWargear` (process­UnitLogic.ts) becomes the shared matching primitive for list-import's own wargear validation too.

## Goals / Non-Goals

**Goals:**
- One authoritative source for a unit's stats/wargear/keywords (`BaseData`), read live everywhere, with zero persisted copies that can go stale.
- Persist only what a human actually decided: the ability-review state (`tag`, structured/OTHER/removed abilities, pending raw-ability queue).
- Fix army-list matching (unit name and wargear) to resolve against that same live `BaseData`, so a unit becomes matchable the moment it's uploaded, independent of catalog bookkeeping or manual review/confirmation status.
- Keep the existing IndexedDB `unitData` store and version as-is; only narrow what's written into it going forward (no migration needed - see Decisions).

**Non-Goals:**
- Building a pipeline to populate the `units` catalog's full known-unit list from the scraped `data/<faction>/units.json` files (the FACTIONS tab's "browse units with no BaseData yet" feature stays exactly as it is - just not used for list-import matching anymore). Noted as a related gap in the proposal's conversation but out of scope here.
- Any change to the structured-`rule` format, simulation engine, or Process Unit's per-ability review UI/flow beyond what's needed to drop stats/wargear/keywords.
- Any change to `list-view`'s own behavior - it already matches this change's end state.

## Decisions

**Rename `UnitData` to `StructuredAbilitiesData`, keep the IndexedDB store name unchanged, no version bump.**
The new shape (`{ tag, abilities, rawAbilities }`) is a structural subset of today's `UnitData`. Existing records in the `unitData` IndexedDB store already have `tag`/`abilities`/`rawAbilities` with the right content - they just also carry now-ignored `stats`/`wargear`/`keywords`/`id`/`name` fields, which are simply never read again and get dropped the next time that record is written (e.g. on next Confirm). So every existing `PENDING`/`CONFIRMED` record keeps working with zero data loss and no migration code.
- Alternative considered: bump `DB_VERSION` and rename the object store to `structuredAbilities` for naming purity, migrating old records in `onupgradeneeded`. Rejected - adds real migration-code risk and complexity for a purely cosmetic store-name win; the store name is an internal string never exposed to users or specs.

**Split `preprocessBaseData` into a live-display function and a small review-queue seed function.**
Today's single `preprocessBaseData(baseData): UnitData` becomes:
- `getUnitWargear(baseData): WargearEntry[]` - the existing wargear-catalogue-building logic (unchanged internals), exported directly instead of being one field of a bigger object.
- `getUnitKeywords(baseData): string[]` - the existing representative-miniature keyword logic, exported directly.
- `seedStructuredAbilities(baseData): StructuredAbilitiesData` - returns `{ tag: "PENDING", abilities: [], rawAbilities: toRawAbilities(baseData) }`, used only by `UploadModal` on first upload.
`ListDetailView` and `ProcessUnitView` both call `getUnitWargear`/`getUnitKeywords` directly wherever they currently destructure `.wargear`/`.keywords` off a `preprocessBaseData()` result; neither ever needs `.stats` from this module since `extractDatasheetContext` already provides per-miniature stats.
- Alternative considered: keep one function returning `{ keywords, stats, wargear }` for display plus a separate seed function. Rejected - `stats` has no caller left once `ProcessUnitView`'s "Simulation stats" block is removed (the Models table from `extractDatasheetContext` already shows it), so keeping it just to mirror the old shape would be dead weight.

**Drop `ProcessUnitView`'s "Simulation stats (UnitData)" block; keep its Models table.**
That block showed `draft.stats`/`draft.keywords` - a stored copy of what the Models table (from `extractDatasheetContext`, BaseData-sourced) already displays. No requirement mandates this block specifically (it was incidental to the old `UnitData`-centric implementation), so removing it is a pure simplification, not a spec change. A small keywords line is kept, moved into the shared `UnitDatasheet` component (new optional `keywords` prop) so neither screen loses that information.

**Army-list import matches unit names against live BaseData per faction, via a new `getBaseDataUnitsByFaction` helper.**
`parseAndValidateArmyList` currently calls `getUnitsByFaction(factionSlug)` to build the `{slug, name}[]` list that `matchUnitNames`/`applyParentFallback` match against. Those two matching functions don't need to change at all - only the data source does. The new `db.ts` helper does the same cursor-scan pattern as `getUnitsByFaction`, but over the `baseData` store, returning `{slug, name: record.name}` for each BaseData record under a faction prefix.
- Alternative considered: keep matching against the `units` catalog but fix `UploadModal` to name new catalog records from `BaseData.name` (proposal's `faction-unit-browser` fix) and stop there. Rejected as insufficient on its own - it fixes new uploads going forward but leaves already-broken catalog records (like the one already created in the user's own test session) permanently unmatchable without a manual IndexedDB edit. Matching against BaseData directly fixes both new and already-uploaded units uniformly, with no cleanup step needed.

**Army-list import matches wargear tokens against the matched unit's live BaseData wargear catalogue, reusing `matchLoadoutWargear`.**
`parseAndValidateArmyList` currently builds `knownWargearNames` from `getUnitData(...).wargear`. It changes to call `getBaseData(...)` and flatten `getUnitWargear(baseData)`'s item/profile names the same way - the exact name-matching semantics `list-view`'s `matchLoadoutWargear` (processUnitLogic.ts) already implements for its own filtering. `matchWargearTokens` (parseArmyList.ts) itself is unchanged - it already takes a plain `string[] | null` of known names, agnostic to where they came from.
- This retires the "unverified because not yet CONFIRMED" state entirely: `unverified` now only means "no BaseData uploaded for this unit at all," which is both a more useful signal and consistent with how `list-view`'s own fallback already treats BaseData-less units.

**`faction-unit-browser`'s Upload Modal names new catalog units from `BaseData.name`.**
`UploadModal.handleConfirm`'s `putUnit(...)` call for an unmatched file uses `(entry.data as BaseData).name` instead of `entry.slug`. This is a one-line fix but is the thing that makes a freshly-uploaded unit's catalog entry human-readable again (the FACTIONS tab's unit list still reads from this catalog, independent of the list-import matching change above).

## Risks / Trade-offs

- **Existing `StructuredAbilitiesData` records retain unused legacy fields (`stats`/`wargear`/`keywords`/`id`/`name`) until next write.** [Risk: confusing to a future reader inspecting raw IndexedDB contents] → Mitigation: harmless at runtime (TypeScript types simply stop reading them); every record gets slimmed the next time its unit is re-confirmed or re-seeded. Not worth a migration pass for a purely cosmetic concern.
- **Already-imported army lists keep their stale `matchedUnitSlug`/`matchedFactionSlug`/`wargearTokens` from before this change**, same as today - matching only happens at import time, and this change doesn't alter that (re-matching previously-imported lists is unchanged, pre-existing behavior, not introduced by this change). [Risk: a user expects a previously-"unmatched" entry to resolve itself after uploading BaseData] → Mitigation: re-pasting the same list (same `listUrl` dedupes in place) re-runs matching against the now-correct sources; this is the same existing recourse as today, just now actually effective once BaseData exists.
- **`getBaseDataUnitsByFaction` duplicates the cursor-scan pattern already used by `getUnitsByFaction`/`getBaseDataCount`.** [Risk: three near-identical scan functions in `db.ts`] → Accepted - matches the file's existing style (each store has its own small set of direct accessors); a shared generic scan helper is a reasonable follow-up but not required for this change.
