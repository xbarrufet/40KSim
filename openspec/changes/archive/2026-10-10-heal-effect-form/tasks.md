# Tasks

## 1. Schema

- [x] 1.1 Add `amount: string` field to `HealEffect` in `schema.ts` (optional for backward compat with existing data). Verify with `npx tsc -b --noEmit`.

## 2. Form and Display

- [x] 2.1 Update `defaultEffect('heal')` in `ProcessUnitView.tsx` to include `amount: '1'`. Verify with `npx tsc -b --noEmit`.
- [x] 2.2 Add the heal form fields in the `renderCategoryFields` function: a `DiceNotationInput` labelled "Cantidad" bound to `effect.amount`. Verify the field appears when selecting "Curar".
- [x] 2.3 Update `describeEffect` for the `heal` case to display `Curar ${effect.amount ?? '1'}` instead of `'Curar (stub)'`. Verify the label shows the notation value.

## 3. Verification

- [x] 3.1 Run `npm run build` — no errors.
- [x] 3.2 Run `npm run lint` — no new issues.
- [x] 3.3 Run `npm run test` — existing tests pass.
