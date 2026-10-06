# Proposal

## Why

The `list-view` change made `BaseData` the live source of truth for display (stats, wargear, abilities), computed on demand via `preprocessBaseData`/`extractDatasheetContext` — it never reads `UnitData` at all. That exposed that `UnitData`'s `stats`/`wargear`/`keywords` are now a pure, redundant copy of what `BaseData` already holds, kept in sync only by a manual "Re-Sync" action. It also surfaced a real bug: when BaseData is uploaded for a unit the catalog doesn't know yet, the auto-created `units` catalog record is named after the raw file slug (e.g. `"eradicator-squad-with-melta-rifles"`) instead of the unit's real name, so army-list import's name matching (which compares against that catalog) silently fails even after the unit is fully uploaded and reviewed. Both problems trace back to the same thing: there are three overlapping "what is this unit" records (`units` catalog, `BaseData`, `UnitData`), and only one of them (`BaseData`) is authoritative and always fresh.

## What Changes

- `UnitData` shrinks to only what genuinely can't be derived from `BaseData`: the manual ability-review state (`tag`, reviewed `abilities`, and the still-pending `rawAbilities` queue). Renamed `StructuredAbilitiesData` to reflect that. Stats, wargear, and keywords are no longer persisted anywhere — every screen that shows them computes them live from `BaseData`, same as `list-view` already does.
- Process Unit's "Automatic Preprocessing on First Upload" narrows to seeding just the ability-review queue (`tag: PENDING` + raw abilities) instead of copying stats/model profiles/wargear into a stored record. Its "Manual Re-Sync" narrows to reconciling that same queue against the current BaseData (picking up newly-scraped abilities) instead of refreshing stats/wargear/model profiles, which no longer exist to go stale. The Process Unit screen's separate "Simulation stats" display is dropped — the existing BaseData-sourced Models table already shows the same numbers.
- Army list import's **Unit Name Validation** matches a pasted entry's unit name directly against uploaded `BaseData.name` values for the faction (falling back to the parent faction, same as today), instead of the separately-seeded `units` catalog. This is what actually fixes the bug above — a unit becomes matchable the moment its BaseData is uploaded, regardless of what the catalog's auto-created name looks like.
- Army list import's **Weapon Name Validation** matches wargear tokens against the matched unit's live `BaseData`-derived wargear catalogue (the same name-matching `list-view` already uses to filter its weapon tables), instead of `UnitData.wargear`. A token is `unverified` only when the matched unit has no `BaseData` at all — not merely because it hasn't been through manual review yet.
- Faction & Unit Browser's Upload Modal: when auto-creating a catalog record for a unit with no existing match, its `name` is taken from the uploaded BaseData's own `name` field instead of the raw file slug.

## Capabilities

### New Capabilities
(none — this only changes how existing capabilities get their data)

### Modified Capabilities
- `simulation-unit-data`: the persisted unit-review record drops stats/wargear/keywords/id/name, keeping only the review tag and abilities; the "Simulation Unit" shape for actual simulation is now assembled by joining live BaseData with this slimmed record, not stored as one blob.
- `process-unit`: "Automatic Preprocessing on First Upload" and "Manual Re-Sync" narrow to the ability-review queue only; "Confirm Action" persists only reviewed abilities, not stats/wargear.
- `army-list-upload`: "Unit Name Validation" and "Weapon Name Validation" resolve against live `BaseData` instead of the `units` catalog / `UnitData.wargear`.
- `faction-unit-browser`: the Upload Modal's auto-created unit record uses the BaseData's own name instead of the file slug.

## Impact

- `app/src/data/schema.ts`: `UnitData` interface replaced by a slimmer `StructuredAbilitiesData` (`tag`, `abilities`, `rawAbilities` only).
- `app/src/data/db.ts`: `getUnitData`/`putUnitData` renamed to match the new type; new `getBaseDataUnitsByFaction`-style helper to list `{slug, name}` from uploaded BaseData for a faction, used by list-import matching in place of `getUnitsByFaction`. No IndexedDB version bump needed — the new shape is a structural subset of the old `unitData` store records, so existing `PENDING`/`CONFIRMED` data keeps working unmigrated.
- `app/src/data/preprocessBaseData.ts`: split into live-display helpers (wargear catalogue, keywords) usable with no stored record, and a small seed function for the initial ability-review queue.
- `app/src/home/ProcessUnitView.tsx` / `UploadModal.tsx` / `UnitsView.tsx`: updated to the renamed type/functions; ProcessUnitView drops its separate "Simulation stats" block.
- `app/src/data/parseArmyList.ts`: `parseAndValidateArmyList`'s unit/wargear matching reads BaseData instead of the `units` catalog / `UnitData`.
- `app/src/list/ListDetailView.tsx`: unaffected — it already reads BaseData directly and never touched `UnitData`.
- Existing tests touching the old shape (`db.test.ts`, `uploadFlow.test.ts`, `preprocessBaseData.test.ts`, `parseArmyList.test.ts`) updated accordingly.
