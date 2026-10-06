# Tasks

## 1. UnitData types and weapon-keyword vocabulary

- [x] 1.1 Add `UnitData`/structured-rule TypeScript interfaces (`tag`, `stats`, `wargear` catalogue, `abilities[]` with `rule` or `category: "OTHER"`/`text`) to `app/src/data/schema.ts` matching the `simulation-unit-data` spec, and verify `npm run build` type-checks cleanly with the new types unused but exported
- [x] 1.2 Add a static weapon-keyword lookup table (the 36 known values: `TORRENT`, `SUSTAINED HITS N`, `BLAST N`, `MELTA N`, `RAPID FIRE N`, `ANTI-X Y+`, `CLEAVE N`, `DEVASTATING WOUNDS`, `TWIN-LINKED`, `HAZARDOUS`, `HEAVY`, `IGNORES COVER`, `INDIRECT FIRE`, `LETHAL HITS`, `ONE SHOT`, `PRECISION`, `PSYCHIC`, `EXTRA ATTACKS`, `ASSAULT`, `CLOSE-QUARTERS`) with name normalization (case-insensitive, strip `: non-MONSTER/VEHICLE` qualifiers) and value extraction (e.g. `SUSTAINED HITS 1` → `{name: "SUSTAINED_HITS", value: 1}`), with a unit test asserting each of the 36 known names from the real scraped data parses correctly

## 2. Automatic preprocessing

- [x] 2.1 Implement a `preprocessBaseData(baseData): UnitData` function that copies stats/model-profiles/wargear catalogue from BaseData and parses weapon-profile abilities via the lookup table from 1.2, leaving datasheet/faction/core-type abilities as unparsed raw entries (no `rule`, no `category` yet) for later manual review; verify against `data/space-marines/BaseData/aggressor-squad.json` and `data/space-marines/BaseData/ancient.json` fixtures that stats/wargear/weapon-keywords match expectations
- [x] 2.2 Add `putUnitData`/`getUnitData` to `app/src/data/db.ts` for the `unitData` store (parallel to existing `putBaseData`), and verify a round-trip put/get test passes

## 3. Upload flow: generate UnitData only for new units

- [x] 3.1 In `app/src/home/UploadModal.tsx`, after `putBaseData`, check whether `unitData` already exists for that key; if not, run `preprocessBaseData` (2.1) and `putUnitData` with `tag: "PENDING"`; if it exists, skip entirely — verify by uploading a new unit's BaseData and confirming a `PENDING` UnitData record is created, then re-uploading the same file and confirming the UnitData record is byte-identical to before (untouched)
- [x] 3.2 Verify re-uploading BaseData for a unit with `tag: "CONFIRMED"` leaves that UnitData's `tag` and content unchanged (manual test matching the Re-upload Does Not Affect Existing UnitData scenarios)

## 4. Status light and counters

- [x] 4.1 Update `UnitStatus` in `app/src/data/db.ts` to `'red' | 'green'` and rewrite `getUnitStatuses` to read `unitData.tag` (red = missing or `PENDING`, green = `CONFIRMED`), removing the old two-store existence check; verify with a test covering all three input combinations (no unitData, `PENDING`, `CONFIRMED`)
- [x] 4.2 Update `app/src/home/UnitsView.tsx` status light rendering for the 2-state model and verify visually in the running app that red/green render correctly for a `PENDING` and a `CONFIRMED` unit
- [x] 4.3 Update the faction card "N base / M processed" counter in `app/src/home/FactionsView.tsx` (and its backing count query) so `M` counts `tag: "CONFIRMED"` units, not mere UnitData existence; verify the displayed count changes only after a unit is confirmed, not on upload

## 5. Process Unit screen

- [x] 5.1 Create the Process Unit screen component, wired from the dead unit-name link in `UnitsView.tsx`, showing: unit stats/wargear (read-only, from the automatic preprocessing), and every raw ability from BaseData with its text and an action control (Structure / Remove / Mark as OTHER) — verify by opening it for `aggressor-squad` and seeing its 2 datasheet abilities, plus the faction/core stub abilities, all listed
- [x] 5.2 Implement the "Structure it" action: a form for one structured entry (`type`, `appliedTo`, `trigger`, `target`, `value`) plus an "add another effect" control that adds further structured entries fanned out from the same raw ability, held in local component state until save — verify by structuring the "Finest Hour"-style compound case into two entries in a test fixture
- [x] 5.3 Implement "Remove" and "Mark as OTHER" actions per raw ability, held in local state until save — verify removed abilities don't appear and OTHER-marked abilities keep their original text with no `rule`
- [x] 5.4 Implement "Manual re-sync": re-run `preprocessBaseData` against the unit's current BaseData and merge the refreshed stats/wargear/weapon-keyword-abilities into the in-progress state without discarding already-reviewed (structured/removed/OTHER) abilities — verify by re-syncing after editing a fixture's points in BaseData and confirming reviewed abilities survive
- [x] 5.5 Implement Save: write the assembled `UnitData` with `tag: "CONFIRMED"` via `putUnitData`, and verify the unit list status light turns green and the faction counter in 4.3 increments after saving

## 6. Spec validation

- [x] 6.1 Run `openspec validate process-unit-data --strict` and resolve any reported issues

## 7. Datasheet-style redesign of Process Unit screen

- [x] 7.1 In `ProcessUnitView.tsx`, fetch BaseData via `getBaseData` and render read-only sections for: a Models table (one row per `miniatures[]` entry, columns M/T/SV/W/LD/OC), a Costs box (one row per `compositions[]` entry), the `unitComposition` text, and "Led by"/"Supported by" tag lists derived from `ledBy` (split by `attachType`) — verify by opening `aggressor-squad` and seeing both miniature rows, both composition cost rows, and the Tor Garadon/Captain in Gravis Armour/Marneus Calgar/Iron Father Feirros "Led by" tags plus the Apothecary Biologis "Supported by" tag
- [x] 7.2 Replace the flat wargear list with separate Ranged Weapons and Melee Weapons tables (split by `profile.type`), each weapon profile as a row with its parsed `WeaponAbility[]` rendered as chip badges — verify by opening `aggressor-squad` and seeing Flamestorm Gauntlets' two profiles correctly split and tagged (e.g. the Ranged profile showing BLAST 2/TORRENT/TWIN-LINKED chips)
- [x] 7.3 Add CSS for the new Models/Costs/Composition/Led-by/Supported-by sections and the weapon tables + ability chip badges, matching the app's existing light-theme variables and `Barlow Condensed` heading style — verify `npm run build` and `npm run lint` pass
- [x] 7.4 Re-run the full test suite (`npm test`) and confirm the existing Structure/Remove/Mark-as-OTHER/Resync/Save behavior is unaffected by the layout change

## Workflow follow-up

- Once implementation and review are complete, archive the change with `/opsx:archive`.
