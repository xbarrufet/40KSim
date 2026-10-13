# Tasks

## 1. Parent Faction Map

- [x] 1.1 Create `app/src/data/factions.ts` with a `PARENT_FACTION` map (11 SM subfactions -> `space-marines`), a `getParentFaction(slug)` helper, and a `resolveDataFaction(factionSlug, unitSlug)` async helper that returns the subfaction slug if the unit has its own `base_data`, otherwise the parent slug. Verify: `npm run build` passes.

## 2. Inherited Reads in db.ts

- [x] 2.1 Update `getUnitStatuses` to fetch `unit_data` from both the subfaction and the parent (when one exists) in parallel, merging results with subfaction taking priority. Verify: `npm run build` passes.
- [x] 2.2 Update `getStructuredAbilitiesData` to fall back to the parent faction when no record exists for the subfaction. Return the data along with the resolved `factionSlug`. Verify: `npm run build` passes.
- [x] 2.3 Update `getLoadoutData` to fall back to the parent faction when no record exists for the subfaction. Return the data along with the resolved `factionSlug`. Verify: `npm run build` passes.
- [x] 2.4 Update `getBaseData` to fall back to the parent faction when no record exists for the subfaction. Verify: `npm run build` passes.

## 3. ProcessUnitView Writes to Owning Faction

- [x] 3.1 Update `ProcessUnitView` to resolve the owning faction slug on mount (using `resolveDataFaction`). Use the resolved slug for all save operations (abilities and loadout). Verify: `npm run build` passes.

## 4. Verification

- [x] 4.1 Verify `npm run build` and `npm run lint` pass with all changes.
