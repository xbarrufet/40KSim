# Design

## Context

See proposal.md - Why.

`app/src/data/db.ts` already has an `unitData` object store, keyed the same way as `baseData` (`"<faction-slug>/<unit-slug>"`), but nothing writes to it yet — `getUnitStatuses` only checks whether a key *exists* in `unitData` to decide red/yellow/green. `app/src/data/schema.ts` defines an older `UnitProfile`/`WeaponProfile`/`AbilityProfile` shape used for the seed catalogue (`units.json`) and the current `GameView`/`HomeView` — that shape is not the simulation format and this change does not reuse it; it adds a parallel `UnitData`/structured-rule type definition matching `simulation-unit-data`. The upload flow lives in `HomeView.tsx`'s upload modal, which already writes `baseData` and creates `units` records; this change adds a write to `unitData` in that same flow.

## Goals / Non-Goals

**Goals:**
- Automatic, deterministic preprocessing: stats/model-profiles/wargear/weapon-keyword parsing from BaseData, with no judgment calls, running synchronously as part of the existing upload-confirm transaction.
- A Process Unit screen that lets a human turn each raw BaseData ability into zero, one, or many structured abilities, or mark it `OTHER`, then persist the result as `CONFIRMED`.
- Reuse the existing `unitData` IndexedDB store and the existing upload flow; no new stores, no new upload paths.

**Non-Goals:**
- Any NLP/heuristic parsing of free-text datasheet abilities into proposed rules. The system's automatic pass only handles the closed weapon-keyword vocabulary; everything else is manual.
- Resource/usage tracking for "once per battle/turn" abilities — the trigger is just a question asked each time it's relevant, no state machine.
- Multi-user conflict handling, undo/redo, or versioning of UnitData edits.
- Updating `GameView`/`App.tsx` to actually consume `UnitData` for simulation — this change produces the data; wiring it into the simulator is separate future work (consistent with `GameView`'s simulate button already being disabled).

## Decisions

**Preprocessing runs inline in the upload-confirm transaction, not as a background job.** The app has no backend and no job queue; BaseData files are small (tens of KB). Running the mechanical transform (stats/wargear copy, weapon-keyword lookup) synchronously when `Confirm` is clicked in the upload modal is simplest and matches how `putBaseData`/`putUnit` already work in that flow. Only fires for units with no existing `unitData` key (the "new unit" case) — re-uploads for units that already have a `unitData` record skip this step entirely, per the Re-upload requirement.

**Weapon-keyword vocabulary is a static lookup table in code, not data-driven.** The 36 known keywords (TORRENT, SUSTAINED HITS N, BLAST N, etc.) are a fixed part of the 10th-edition ruleset and don't change per-unit. A `const WEAPON_KEYWORDS: Record<string, {name: string; hasValue: boolean}>` (or similar) module is simplest; growing it for a future edition is a one-line addition, not a data migration. Alternative considered: store the vocabulary as a JSON data file — rejected as unnecessary indirection for something that only code (the simulator) interprets anyway.

**`getUnitStatuses` simplifies to read `unitData.tag` instead of two-store existence checks.** Red = no `unitData` record or `tag !== "CONFIRMED"`; green = `tag === "CONFIRMED"`. The `UnitStatus` type drops `'yellow'`. `hasUnitData` as a boolean existence check becomes less useful on its own; call sites that want "has been reviewed" should check `tag` directly.

**`UnitData` TypeScript interfaces are added fresh in `schema.ts` (or a new `simulationSchema.ts`), not merged into `UnitCatalog`/`UnitProfile`.** The two shapes serve different purposes (seed catalogue vs. simulation-ready data) and `simulation-unit-data`'s own spec already describes a distinct structure (wargear-as-catalogue, structured `abilities[]` with `rule`). Keeping them separate avoids forcing one shape to serve both the lightweight catalogue browser and the richer simulation format.

**Ability review state while editing is not persisted until Confirm.** The Process Unit screen holds in-progress structure/remove/OTHER decisions in local component state; nothing is written to `unitData` until the user explicitly saves. This matches the existing "Confirmation covers only what Confirm does" pattern in the upload modal (Cancel = no side effects) and avoids needing a third persisted state between `PENDING` and `CONFIRMED`.

**The restyled Process Unit screen reads BaseData directly for display-only datasheet context, in addition to UnitData for the editable review state.** Per-miniature stats, composition costs/text, and led-by/supported-by names only exist in BaseData — UnitData intentionally collapsed them (per simulation-unit-data's existing scope). Rather than widen UnitData's schema to carry presentation-only fields the simulator never uses, the screen fetches BaseData (already available via `getBaseData`, used for manual re-sync) purely to render these read-only sections alongside the existing editable abilities/wargear sections. The visual language (tables, chip badges for ability keywords) follows the mockup the user provided, re-themed to the app's existing light palette instead of the mockup's dark one.

**Manual re-sync merges the automatic portion only, leaving reviewed abilities alone.** When the user triggers a manual re-sync (e.g. after a points-only BaseData update), the implementation re-derives stats/model-profiles/wargear/weapon-keyword-abilities from the current BaseData and replaces just those fields in the in-progress UnitData; any abilities already structured, removed, or marked `OTHER` by the user are left as-is. This is an assumption, not something explicitly confirmed in discussion — flagged here rather than guessed silently in code.

## Risks / Trade-offs

- **[Risk]** A raw ability's text changes meaningfully on re-scrape (not just points), but because UnitData is never auto-touched on re-upload, a stale manual structuring could silently drift from the new BaseData text. → **Mitigation**: the Process Unit screen always shows the current BaseData ability text alongside any already-structured entries, so a human reviewing it will see the mismatch; no automatic staleness detection in v1.
- **[Risk]** The weapon-keyword lookup table is incomplete or a scraped name doesn't match exactly (e.g. casing inconsistency already observed in real data: `"PRECISION"` vs `"Precision"`). → **Mitigation**: normalize casing when matching; unrecognized weapon abilities pass through as unparsed raw entries rather than being dropped, so nothing is silently lost (surfaced for the user to notice, even though structuring them isn't in scope for v1).
- **[Trade-off]** Not persisting in-progress review state means a user who navigates away mid-review loses their edits. Accepted because the lifecycle described treats "open Process Unit, review, Confirm" as one sitting; revisit if real usage shows this is painful.
- **[Risk]** A unit's BaseData is missing compositions, `ledBy`, or composition text (sparse or malformed scrape). → **Mitigation**: each BaseData-sourced section is omitted when its data is absent, rather than rendering an empty or broken table.

## Open Questions

- Exact UI layout of the Process Unit screen is now settled at a structural level (Models/Costs/Composition/Led-by/Supported-by sections, ranged/melee weapon tables with ability chips, per the user-provided mockup, re-themed to the light palette) — fine-grained visual details (exact spacing, chip colors beyond the existing palette, column ordering) are still left to implementation and don't change the data model or specs above.
