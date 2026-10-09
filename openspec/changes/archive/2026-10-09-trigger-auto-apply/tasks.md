# Tasks

## 1. Schema

- [x] 1.1 In `app/src/data/schema.ts`, add `autoApply?: boolean` to `StructuredAbility` after `trigger`. Verify: `npm run build` in `app/` succeeds.

## 2. processUnitLogic

- [x] 2.1 In `app/src/home/processUnitLogic.ts`, add `autoApply?: boolean` to `StructuringRow` after `trigger`. In `buildStructuredAbilities`, add `autoApply: row.autoApply` to the mapped object. Verify: `npm run build` succeeds.

## 3. ProcessUnitView

- [x] 3.1 In `ProcessUnitView.tsx`, update `describeAbility`: when `ability.autoApply` is true and `ability.trigger !== 'ALWAYS'`, replace the trigger segment `[${ability.trigger}]` with `[AUTO]`. Verify: `npm run build` succeeds.

- [x] 3.2 In `ProcessUnitView.tsx`, update `startEditing`: seed `autoApply` from `ability.autoApply` into the initial `structuringRows[0]`. The `setStructuringRows` call currently spreads only named fields; add `autoApply: ability.autoApply` to the row object. Verify: `npm run build` succeeds.

- [x] 3.3 In `ProcessUnitView.tsx`, in `StructuringForm`, add a checkbox immediately after the Trigger `<input>` with label "Aplicar siempre (sin preguntar)". The checkbox is `checked={!!row.autoApply}` and calls `onChangeRow(rowIndex, { autoApply: !row.autoApply })`. Disable the Trigger `<input>` when `row.autoApply` is true (add `disabled={!!row.autoApply}`). Verify: `npm run build` succeeds with no lint errors.

## 4. End-to-end verification

- [x] 4.1 Open the Process Unit screen for a unit with a trigger-based ability (e.g. Bladeguard Veteran Squad). Open the structuring form. Check the "Aplicar siempre" toggle. Confirm: the Trigger input is disabled, the toggle state is reflected. Commit the ability. Confirm: the collapsed row shows `[AUTO]` instead of the trigger text.

- [x] 4.2 Click Edit on the auto-apply ability. Confirm: the form reopens with the toggle checked and the trigger text visible (but disabled). Uncheck the toggle. Confirm: the trigger input becomes active. Screenshot both states.
