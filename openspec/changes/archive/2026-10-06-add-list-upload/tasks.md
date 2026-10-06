# Tasks

## 1. Data model

- [x] 1.1 In `app/src/data/schema.ts`, add `ArmyList` and `ArmyListEntry` types: list id, title, factionSlug, armyName (free text), detachment (free text), mission, declaredPoints, listUrl (optional), entries. Each entry has: category, unitName, matchedUnitSlug (nullable), unitStatus (`'matched' | 'unmatched'`), points, modelCount, rawWargearText, wargearTokens (each `{ name, status: 'matched' | 'unmatched' | 'unverified' }`), attachmentText (optional, free text), enhancementText (optional, free text). Verify with `npm run build` (TypeScript check) in `app/`.
- [x] 1.2 In `app/src/data/db.ts`, add a `lists` object store to `getDB()`'s `onupgradeneeded`, bumping `DB_VERSION`. Verify by running the existing test suite (`npm run test` or `npx vitest run` in `app/`) and confirming no existing store/test breaks.
- [x] 1.3 Add `getAllLists`, `getListByUrl`, `putList` (keyed by generated id), and `deleteList` functions to `db.ts`, following the existing get/put function style (see `getUnitData`/`putUnitData`). Write `app/src/data/db.test.ts` cases (using the existing `fake-indexeddb/auto` + vitest setup) for: round-tripping a list, `getListByUrl` finding a match and returning undefined when none exists, and `deleteList` removing a record. Verify with `npx vitest run app/src/data/db.test.ts`.

## 2. List parsing

- [x] 2.1 Create `app/src/data/parseArmyList.ts` with a function that parses the raw pasted text into: title, faction name, armyName, detachment, mission, declaredPoints, listUrl, and raw per-entry blocks (category, unit name, points, model count, raw wargear line, raw attachment line, raw enhancement line) — no catalogue matching yet. Write `app/src/data/parseArmyList.test.ts` covering the structure of the sample export from the proposal/design discussion (multiple categories, a leader with "Attached to", a unit with "Led by", a unit with "Supported by", a unit with an Enhancement line, a single-model unit with no model-count suffix). Verify with `npx vitest run app/src/data/parseArmyList.test.ts`.
- [x] 2.2 Add a wargear-line tokenizer function to `parseArmyList.ts` that splits a raw wargear line on `/` then `+`, stripping a leading `N×` count prefix from each resulting name. Add test cases for a single-weapon line, a multi-slot line (` / `), a combo line (` + `), and a line with no count prefix (implicit single model). Verify with `npx vitest run app/src/data/parseArmyList.test.ts`.
- [x] 2.3 Add unit-name matching: given a faction slug and the IndexedDB `units` records for that faction, resolve each parsed entry's `matchedUnitSlug` and `unitStatus` via case-insensitive exact match. Add test cases for a match, a non-match, and a faction with no units loaded. Verify with `npx vitest run app/src/data/parseArmyList.test.ts`.
- [x] 2.4 Add wargear-token matching: given a matched entry's `unitData.wargear` (when present), resolve each wargear token's `status` by case-insensitive exact match against `wargearItem.name` and weapon profile names. When the unit has no `unitData`, or the entry's unit is unmatched, mark all of that entry's tokens `unverified`. Add test cases for a matched token, an unmatched token, and the unverified case (no `unitData`). Verify with `npx vitest run app/src/data/parseArmyList.test.ts`.

## 3. Save with dedupe

- [x] 3.1 Add a `saveParsedList` function (in `parseArmyList.ts` or a new small module) that takes a parsed+validated list and calls `getListByUrl` (when the parsed list has a `listUrl`) to decide whether to `putList` as a new record or overwrite the existing one, reusing its id. Add test cases for: no `listUrl` present (always creates new), a new `listUrl` (creates new), and a `listUrl` matching an existing stored list (overwrites, same id, no second record). Verify with `npx vitest run app/src/data/db.test.ts` (or wherever these cases land).

## 4. LIST tab UI

- [x] 4.1 Replace the disabled placeholder in `app/src/list/ListView.tsx` with a `<textarea>` for pasting list text and an enabled submit button that runs the full parse → validate → save pipeline from sections 2-3 and refreshes the displayed list afterward. Verify manually by running `npm run dev` in `app/`, pasting the sample export, and confirming it is parseable without throwing.
- [x] 4.2 Render all saved lists (from `getAllLists`) below the paste input, each showing its title, faction, army name, detachment, mission, declared points, and one row per entry showing the unit name with a matched/unmatched indicator (reusing the existing red/green status-light visual pattern from `faction-unit-browser`) and the wargear tokens with matched/unmatched/unverified indicators. Verify manually in the dev server with a pasted list that has at least one unmatched unit and one unit with no `unitData` (unverified weapons).
- [x] 4.3 Add a delete action per saved list that calls `deleteList` and refreshes the display. Verify manually in the dev server that deleting a list removes it from IndexedDB (and from the UI) without affecting other saved lists.
- [x] 4.4 Add any new CSS needed for the paste textarea, submit button, and saved-list display to `app/src/App.css`, following the existing plain-CSS conventions used by `faction-unit-browser`'s views. Verify visually via `npm run dev`.

## 5. Verification

- [x] 5.1 Run `npm run build` and `npm run lint` in `app/` and confirm both pass with no new errors.
- [x] 5.2 Manually paste the full sample export (Imperial Fists list with Tor Garadon, named characters, "Attached to"/"Led by"/"Supported by" lines, an Enhancement line, and units across multiple categories) into the running app and confirm: the list saves, every unit resolves as matched (Imperial Fists units are seeded), every wargear token shows unverified (no Imperial Fists `unitData` exists yet), and re-pasting the same text updates the same saved list rather than creating a duplicate.
