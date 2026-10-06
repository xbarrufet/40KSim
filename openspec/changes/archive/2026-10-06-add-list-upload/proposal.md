# Proposal

## Why

The LIST tab is currently a disabled placeholder (`app/src/list/ListView.tsx`) that already promises the user they'll be able to paste a list's text to save and delete it. Players build their armies in the 40k.app list builder, not in 40KSim, so the simulator needs a way to ingest that existing list rather than requiring the user to re-enter every unit and weapon by hand. Validating the pasted list against the unit/weapon data already stored in IndexedDB also surfaces typos, renamed units, or units/weapons the catalogue doesn't know about yet — before the list is used anywhere else in the app (e.g. a future Game tab list picker).

## What Changes

- Add a paste-text input to the LIST tab that accepts a 40k.app army list text export.
- Parse the pasted text into a structured list: title, faction, free-text army name, free-text detachment, mission, declared points, and one entry per unit block (name, points, model count, category, wargear text, optional attached-to/led-by/supported-by text, optional enhancement text).
- Validate each entry's unit name against the faction's known units (IndexedDB `units` store).
- Validate each entry's wargear names (tokenized from the wargear line) against that unit's known wargear catalogue (IndexedDB `unitData` store), when that unit has been processed; mark wargear as unverified (not failed) when the unit has no `unitData` yet.
- Detachment, enhancement, and attached-to/led-by/supported-by text are stored verbatim and are **not** validated (explicitly out of scope for this change).
- Store the parsed list in a new IndexedDB object store, regardless of validation outcome, with pass/fail/unverified flags per entry and per wargear token.
- Support multiple saved lists. Re-pasting a list whose 40k.app export footer URL matches an already-saved list updates that list in place instead of creating a duplicate.
- Let the user view and delete saved lists from the LIST tab.

## Capabilities

### New Capabilities
- `army-list-upload`: Parsing a 40k.app army list text export into a structured list, validating unit and weapon names against the existing unit/wargear catalogue, and storing/managing the result (including multiple lists and URL-based dedupe) in IndexedDB.

### Modified Capabilities
(none — this introduces a new capability without changing existing requirements in `faction-unit-browser`, `process-unit`, or `simulation-unit-data`)

## Impact

- `app/src/list/ListView.tsx`: replace the disabled placeholder with the paste input, validation results, and saved-list management UI.
- `app/src/data/schema.ts`: add types for a parsed/stored army list and its entries.
- `app/src/data/db.ts`: add a new object store and CRUD functions for saved lists.
- New parsing/validation module (e.g. `app/src/data/parseArmyList.ts`), unit-tested like the existing `preprocessBaseData.ts`/`weaponKeywords.ts` modules.
- No changes to the Python scraping pipeline or scraped data formats.
