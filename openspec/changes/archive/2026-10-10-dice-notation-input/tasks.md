# Tasks

## 1. Dice notation utilities

- [x] 1.1 Create `app/src/data/diceNotation.ts` with `DICE_NOTATION_REGEX`, `parseDiceNotation(s: string): { count: number; dice: 'D3' | 'D6' | null; modifier: number } | null`, and `serializeDiceNotation(parsed): string`. Verify `npm run build` passes.
- [x] 1.2 Add `isValidDiceNotation(s: string): boolean` helper that tests the regex. Verify it rejects `"0"`, `"D4"`, `"7D6"`, `"abc"`, `""` and accepts `"1"`, `"D6"`, `"2D3+1"`, `"10"`.

## 2. Schema type changes

- [x] 2.1 In `schema.ts`, replace `MortalWoundsHits` type: remove `fixed` and `roll` variants, add `{ kind: 'notation'; value: string }`. Keep `byStat` unchanged. Replace `MortalWoundsDamage` type with a plain `string` on `MortalWoundsEffect.damagePerSuccess`. Remove the `MortalWoundsDamage` type. Verify `npm run build` passes.

## 3. Form components

- [x] 3.1 Create a `DiceNotationInput` component in `ProcessUnitView.tsx`: a text input with placeholder `"ej: 3, D6, 2D3+1"`, an `error` boolean prop for highlighting, and `value`/`onChange` props. Apply an error CSS class when `error` is true. Verify `npm run build` passes.
- [x] 3.2 Replace `MortalWoundsHitsFields`: change the "Fijo"/"Tirada" selector to "Notación"/"Por Stats". When "Notación" is selected, render `DiceNotationInput` instead of the dropdown combos. Remove the old fixed/roll sub-fields. Verify `npm run build` passes.
- [x] 3.3 Replace `MortalWoundsDamageFields` with a single `DiceNotationInput`. Remove the `MortalWoundsDamageFields` component entirely. Verify `npm run build` passes.
- [x] 3.4 Update `defaultEffectForCategory('mortalWounds')` to use the new shape: `hits: { kind: 'notation', value: '1' }`, `damagePerSuccess: '1'`. Update `describeHits` and `describeDamage` helper functions. Verify `npm run build` passes.

## 4. Save-time validation

- [x] 4.1 Add validation logic before the save action in `ProcessUnitView`: iterate all structured abilities' effects, validate dice notation fields with `isValidDiceNotation`, collect errors. If errors exist, block save and set error state on the invalid `DiceNotationInput` instances. Verify `npm run build` passes and invalid values block save.

## 5. CSS and integration

- [x] 5.1 Add CSS for `DiceNotationInput`: error state border/outline style matching the existing form aesthetic. Add `.dice-notation-error` class. Verify styling renders correctly.
- [x] 5.2 Run `npm run build` and `npm run lint` with zero errors. Start dev server and verify: creating a mortal wounds effect with notation `"2D6"` for hits and `"D3"` for damage saves correctly; invalid notation `"D4"` blocks save with error highlight.

## Workflow follow-up

- Archive the change after verifying all task groups.
