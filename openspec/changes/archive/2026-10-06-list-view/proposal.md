# Proposal

## Why

Saved army lists can be imported and deleted, but there is no way to actually browse one: see its units, points, and model counts, and look up a unit's live stats/wargear/abilities. The only screen that renders a unit's datasheet today is the admin-facing Process Unit review flow, which requires the unit to already be manually confirmed. The GAME tab is currently a disabled attacker/defender picker stub with no connection to saved lists at all. Players need quick, read-only access to their army's actual loadout both when reviewing a list and during a live game.

## What Changes

- New two-column list-view screen:
  - Left column: the list's units grouped by category (as parsed), each row showing name, model count, points, and leader/attachment text.
  - Right column: the selected unit's live datasheet — stats, ranged/melee weapon tables, and raw ability text — computed on the fly from the unit's `BaseData` via the existing `preprocessBaseData`/`extractDatasheetContext` helpers. This does **not** require the unit to have a `CONFIRMED` UnitData record.
  - The weapon tables are filtered to only the wargear the entry's own loadout text (`rawWargearText`/`wargearTokens`) actually specifies, not the unit's full datasheet options. Any loadout token that doesn't match a known wargear name is still shown as plain text so nothing declared is silently dropped.
  - Entries with no matched unit, or a matched unit with no `BaseData` uploaded, fall back to showing only the entry's own stored fields (name, points, models, raw wargear text, attachment text) with a notice that no datasheet is available yet.
  - Visual style follows the app's existing light theme and component classes (`.datasheet-table`, `.tag-chip`, etc.), not the dark mockup reference.
- LIST tab: clicking a saved list's row opens this screen for that list; a back action returns to the saved-lists table.
- **BREAKING**: GAME tab's existing attacker/defender unit picker (`GameView.tsx`) is removed entirely. The GAME tab instead shows a picker over the same saved lists, opening the identical list-view screen for in-game reference. Unit-vs-unit combat simulation is out of scope for this change.

## Capabilities

### New Capabilities
- `list-view`: The two-column army list browser (grouped roster + selected unit's live datasheet, filtered to its actual loadout), shown from the LIST tab when opening a saved list and as the GAME tab's main content.

### Modified Capabilities
- `army-list-upload`: "View and Delete Saved Lists" gains a scenario where selecting a row opens the list-view screen for that list, instead of the table being terminal.

## Impact

- `app/src/list/ListView.tsx`: row click opens the new detail screen.
- New component(s) under `app/src/list/` for the two-column screen, plus a shared read-only datasheet-rendering piece factored out for reuse with `app/src/home/ProcessUnitView.tsx` (which renders the same stats/weapon tables today, just with editing controls around them).
- `app/src/game/GameView.tsx`: deleted and replaced with a saved-list picker that opens the same screen.
- `app/src/App.tsx`: GAME tab wiring updated; GAME tab label and position unchanged.
- `app/src/App.css`: new layout styles within the existing theme.
- No IndexedDB schema changes — reads existing `ArmyList` and `BaseData` records only.
