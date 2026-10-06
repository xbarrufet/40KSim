# Tasks

## 1. Wargear-loadout matching logic

- [x] 1.1 In `app/src/home/processUnitLogic.ts` (or a new sibling module if that file is getting crowded), add a pure function that takes an entry's wargear token names plus a `WargearEntry[]` catalogue and returns the matching `WargearEntry[]` (case-insensitive match on `wargearItem.name` or any `profiles[].name`) and the leftover unmatched token names. Verify with new unit tests covering: a token matching an item name, a token matching only a profile name, an unmatched token, and mixed matched/unmatched tokens in one call.
- [x] 1.2 Run `npm test -- processUnitLogic` (or wherever the new tests land) and confirm they pass.

## 2. Shared read-only datasheet rendering

- [x] 2.1 Extract the read-only stats table, ranged/melee weapon tables (`WeaponTables`/`WeaponRowGroup`), and raw-ability list currently inline in `app/src/home/ProcessUnitView.tsx` into a shared component (e.g. `app/src/home/UnitDatasheet.tsx`) that accepts a `DatasheetContext` plus the wargear/raw-abilities data and renders with no editing affordances. Verify by having `ProcessUnitView` render through the extracted component and confirming `npm run build` (TypeScript check) passes with no behavior change.
- [x] 2.2 Manually re-run the Process Unit screen for an already-uploaded unit (via `npm run dev`) and confirm the stats table, weapon tables with ability chips, and raw-ability list still render exactly as before the extraction.

## 3. List-view two-column screen

- [x] 3.1 Create `app/src/list/ListDetailView.tsx` taking an `ArmyList` and a back callback. Render the left column grouped by `entry.category`, each row showing `unitName`, `modelCount`, `points`, and `attachmentText` (per the Roster Grouped by Category requirement). Verify by rendering a saved list in the dev server and checking categories/fields match the stored entries.
- [x] 3.2 Add row selection state: clicking a row selects it (visually marked) and defaults to the first entry on mount (per the Unit Selection requirement). Verify by clicking through rows in the dev server and confirming the right column updates and the first row is pre-selected on open.
- [x] 3.3 Wire the right column: for the selected entry, if `matchedFactionSlug`/`matchedUnitSlug` are set, call `getBaseData` then `preprocessBaseData`/`extractDatasheetContext`, and render through the shared `UnitDatasheet` component from Task 2 (per the Live Unit Datasheet From BaseData requirement). Verify with a Space Marines unit that has BaseData but no `CONFIRMED` UnitData, confirming the full datasheet still renders.
- [x] 3.4 Filter the weapon tables passed into `UnitDatasheet` using the Task 1 matching function against the selected entry's `wargearTokens`, and render any unmatched token names as plain text alongside the tables (per the Weapon Tables Filtered to Declared Loadout requirement). Verify with a unit whose loadout text names only some of its datasheet's weapon options, confirming only those appear as table rows.
- [x] 3.5 Add the no-datasheet fallback: when the entry is unmatched, or matched but `getBaseData` returns nothing, show only the entry's own fields (name, points, models, `rawWargearText`, `attachmentText`) plus a notice (per the No-Datasheet Fallback requirement). Verify with an unmatched entry and with a matched entry from a faction with no BaseData uploaded.
- [x] 3.6 Style the two-column layout in `App.css` following the existing light theme conventions (reusing `.datasheet-table`, `.tag-chip`, `.process-unit-section` where applicable) per design.md's styling decision. Verify visually in the dev server at desktop and narrow widths.

## 4. LIST tab integration

- [x] 4.1 In `app/src/list/ListView.tsx`, make each saved-list row open `ListDetailView` for that list (excluding clicks on the delete button), with a back action returning to the table (per the army-list-upload Open List Detail requirement). Verify by clicking a row, confirming the detail screen opens, then navigating back and confirming the table is shown again with state intact (e.g. after a delete elsewhere).

## 5. GAME tab replacement

- [x] 5.1 Delete `app/src/game/GameView.tsx` and its attacker/defender-only styles in `App.css` that have no other caller, confirmed via `grep -r` for class names like `.combat-grid`, `.unit-panel`, `.versus-column` before removing them.
- [x] 5.2 Create a new `app/src/game/GameView.tsx` that lists saved lists (via `getAllLists()`) as a simple picker with no add/delete controls, and opens `ListDetailView` on selection, with its own back action returning to this picker (per the GAME Tab Shows the List-View Screen requirement). Verify by selecting a list from the GAME tab and confirming the same two-column screen opens, then navigating back to the GAME tab's picker (not the LIST tab).
- [x] 5.3 Update `app/src/App.tsx` if its import or prop wiring for `GameView` changed. Verify `npm run build` passes and the GAME tab still renders without errors.

## 6. Final checks

- [x] 6.1 Run `npm run build` and `npm run lint` and confirm both pass with no new errors.
- [x] 6.2 Run `npm test` and confirm the full suite passes.
- [x] 6.3 Manually walk through: upload/open a list from LIST tab, select a few units including at least one unmatched or BaseData-less entry, then repeat the same walkthrough from the GAME tab's picker.

## 7. Combined leader/support view, admin-context removal

- [x] 7.1 In `app/src/home/UnitDatasheet.tsx`, add a `showExtendedContext?: boolean` prop (default `true`) gating the Costs/Unit Composition/Led by/Supported by sections, and pass `showExtendedContext={false}` from `ListDetailView` (per the No Admin Review Context in List View requirement). Verify Process Unit still shows all sections unchanged (default `true`), and list-view shows none of them.
- [x] 7.2 Add `resolveAttachedEntry(entry, allEntries)` to `app/src/home/processUnitLogic.ts`: resolves a `Led by <name>` / `Supported by <name>` attachment to the named character's own entry in the same list, case-insensitively, returning undefined for `Attached to ...` entries or unresolvable names. Verify with unit tests covering a "Led by" match, a "Supported by" match, no attachment text, an "Attached to" entry, and a name with no corresponding entry.
- [x] 7.3 In `ListDetailView.tsx`, resolve the selected entry's attached character via Task 7.2, fetch its BaseData alongside the main entry's (in parallel), and merge its models into the Models table and its loadout-filtered wargear into the weapon tables (per the Combined Leader/Support Datasheet requirement). Verify in the dev server with a squad entry attached to a character with its own BaseData uploaded: the character's model row and weapons appear in the squad's datasheet.
- [x] 7.4 Manually verify in the dev server: Process Unit screen is unchanged (still shows Costs/Composition/Led by/Supported by); list-view shows none of those sections; a squad with a matched "Supported by"/"Led by" character shows the combined Models and weapon tables; an entry with no such attachment (or an unresolvable one) is unaffected.

## 8. Weapon model counts, merged abilities

- [x] 8.1 Add `tokenizeWargearLineWithCounts` to `app/src/data/parseArmyList.ts`, reading each loadout slot's leading "N×" count (shared by every "+"-joined item in that slot, defaulting to 1 when absent); rewrite `tokenizeWargearLine` in terms of it. Add `count: number` to `ArmyListWargearToken` (schema.ts) and thread it through `matchWargearTokens`/`parseAndValidateArmyList`, so every stored wargear token carries the model count it was parsed with. Verify with unit tests covering a single-weapon-per-slot line, a "+"-joined slot sharing one count, a slot with no count prefix, and an empty line.
- [x] 8.2 Extend `matchLoadoutWargear` (processUnitLogic.ts) to accept `{name, count}` tokens and return a `modelCounts: Map<wargearItemId, count>` alongside its existing `matched`/`unmatchedTokenNames`. Add `wargearItemId` to `WeaponRow` (`splitWeaponProfiles`). Verify with unit tests confirming the matching token's count is recorded against the matched wargear item's id.
- [x] 8.3 Add an optional `modelCounts?: Map<number, number>` prop to `UnitDatasheet.tsx`: when provided, show a "Modelos" column on both weapon tables with each row's count (falling back to "—" if absent), and size the ability-chip row's `colSpan` to the resulting column count. Verify Process Unit (which never passes this prop) shows no such column.
- [x] 8.4 In `ListDetailView.tsx`, pass the selected entry's (and, when present, its attached character's) `wargearTokens` directly into `matchLoadoutWargear`, merge both calls' `modelCounts` Maps, and pass the merged map into `UnitDatasheet`. Merge the attached character's raw abilities into the displayed ability list via a new `dedupeAbilitiesByName` helper (processUnitLogic.ts), keeping the first occurrence of any name shared between the squad and the attached character. Verify with unit tests for `dedupeAbilitiesByName`.
- [x] 8.5 Manually verify in the dev server: a squad's weapon tables show a "Modelos" column with correct per-weapon counts read from its loadout text; an attached leader/support's weapons show their own count (1 for an unprefixed single-model loadout); the ability list shows both units' abilities with shared-name duplicates collapsed to one; Process Unit's weapon tables show no "Modelos" column.

## 9. Model attribution column, legacy-count fallback

- [x] 9.1 Harden `matchLoadoutWargear` (processUnitLogic.ts) so a matching token with a missing/non-number `count` (e.g. a wargear token saved before Task 8.1 added per-token counts) records a model count of 1 instead of `undefined`. Verify with a unit test passing a token object lacking `count` and asserting the recorded count is 1.
- [x] 9.2 Add an optional `modelNames?: Map<number, string>` prop to `UnitDatasheet.tsx`: when provided, show a "Modelo" column (leftmost, before "Nombre") on both weapon tables naming which unit/character each row belongs to, falling back to "—" if absent, and include it in the ability-chip row's `colSpan` sizing. Verify Process Unit (which never passes this prop) shows no such column.
- [x] 9.3 In `ListDetailView.tsx`, build a `modelNames` map from the selected entry's own matched wargear (keyed by `wargearItem.id`, valued with the selected entry's `unitName`), merging in the attached character's matched wargear keyed to the attached entry's `unitName` when present, and pass it into `UnitDatasheet`. Verify in the dev server that a squad's own weapon rows show the squad's name and an attached leader/support's rows show that character's name.
- [x] 9.4 Manually verify in the dev server with a list saved before Task 8.1 (wargear tokens with no `count` field): the weapon tables show a model count of 1 for every row instead of a broken/blank value, and the new "Modelo" column correctly attributes each row to the squad or its attached character.
