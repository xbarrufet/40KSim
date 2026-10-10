# Tasks

## 1. Schema types

- [x] 1.1 Add `KnownUnitKeyword` type (`'BENEFIT OF COVER' | 'STEALTH' | 'SCOUTS' | 'DEEP STRIKE' | 'LONE OPERATIVE' | 'FIGHTS FIRST'`) and `UnitKeywordEffect` interface (`{ category: 'unitKeyword'; appliedTo: AppliesTo; keyword: KnownUnitKeyword; value: string | null }`) to `schema.ts`. Add `UnitKeywordEffect` to the `Effect` union. Verify `npm run build` passes.

## 2. Form integration

- [x] 2.1 Add `unitKeyword` case to `defaultEffectForCategory` (keyword: `BENEFIT OF COVER`, value: null) and `describeEffect` (show `keyword` + optional value). Add "Keyword Unidad" option to the category `<select>` in the structuring form. Verify `npm run build` passes.
- [x] 2.2 Add `unitKeyword` case to `EffectFields`: keyword dropdown with the known unit keywords, and an optional value text input. Export `KNOWN_UNIT_KEYWORDS` array for the dropdown. Verify `npm run build` passes and the form renders correctly.

## 3. Verification

- [x] 3.1 Run `npm run build` and `npm run lint` with zero errors. Start dev server, create a Stealth ability with category "Keyword Unidad", keyword "BENEFIT OF COVER", save, and verify the data round-trips correctly.

## Workflow follow-up

- Archive the change after verifying all task groups.
