# Tasks

## 1. Schema — Add `MortalWoundsEffect` types

- [x] 1.1 In `app/src/data/schema.ts`, add `MortalWoundsGameEvent`, `MortalWoundsTargetScope`, `MortalWoundsAmount` (tagged union: `fixed` | `roll` | `perModelRoll` | `multiDiceCount`), `MortalWoundsAmountByKeyword`, `MortalWoundsPreRoll`, and `MortalWoundsEffect` interfaces as specified in design.md. Add `MortalWoundsEffect` to the `Effect` union. Verify: `npm run build` in `app/` succeeds with no type errors.

## 2. Schema switch sites — Add `mortalWounds` branch

- [x] 2.1 In `ProcessUnitView.tsx`, add `case 'mortalWounds'` to `defaultEffectForCategory` returning a sensible default `MortalWoundsEffect` (`gameEvent: 'onCharge'`, `targetScope: 'engagedUnit'`, `amount: { kind: 'fixed', value: 1 }`). Verify: TypeScript exhaustiveness check passes (`npm run build`).
- [x] 2.2 In `ProcessUnitView.tsx`, add `case 'mortalWounds'` to `describeEffect` returning a human-readable one-line summary (game event + amount kind + keyword override count if any). Verify: `npm run build` succeeds; the summary appears in the reviewed abilities list when an ability is saved with this category.
- [x] 2.3 Grep for any other `switch (effect.category)` or `.category` fan-out in the codebase (`app/src/**`). For each found, add a `mortalWounds` branch or confirm the missing case is intentional. Verify: `npm run build` succeeds with no unhandled union member warnings.

## 3. Structuring form — Category option and `EffectFields` branch

- [x] 3.1 In `ProcessUnitView.tsx`, add `<option value="mortalWounds">Heridas Mortales</option>` to the category `<select>` in `StructuringForm`. Verify: option appears in the dropdown in the running app.
- [x] 3.2 In `ProcessUnitView.tsx`, add a local `MortalWoundsAmountFields({ amount, onChange })` component (or function) that renders the correct sub-fields for each `amount.kind`: `fixed` → `value` number input; `roll` → `dice` selector + optional `count` + optional `modifier`; `perModelRoll` → `threshold` + `onSuccess`; `multiDiceCount` → `diceCount` + `threshold` + `onSuccess`. Verify: each amount kind renders the correct fields when selected.
- [x] 3.3 In `ProcessUnitView.tsx`, add `case 'mortalWounds'` to `EffectFields` rendering: `gameEvent` select (`onCharge`, `activeAbility`); optional `preRoll` checkbox that enables `dice` select (D3 | D6) and numeric `threshold`; `targetScope` select (`engagedUnit`, `selectedEnemyUnit`); `range` number input when `targetScope` is `selectedEnemyUnit`; base `amount` via `MortalWoundsAmountFields`; an `amountByKeyword` repeatable list (add/remove buttons, each entry has a `targetKeyword` text input and its own `MortalWoundsAmountFields`). Verify: `npm run build` succeeds; all fields render and round-trip correctly in the running app.

## 4. End-to-end verification

- [x] 4.1 Open the Process Unit screen for Assault Intercessors with Jump Packs (Hammer of Wrath). Structure the ability as `mortalWounds` with `gameEvent: onCharge`, `targetScope: engagedUnit`, `amount: { kind: perModelRoll, threshold: 4, onSuccess: 1 }`. Save. Re-open the unit and confirm the structured ability persists correctly in IndexedDB.
- [x] 4.2 Open the Process Unit screen for Incursor Squad (Haywire Mine). Structure as `mortalWounds` with `gameEvent: activeAbility`, `preRoll: { dice: D6, threshold: 2 }`, `targetScope: selectedEnemyUnit`, `range: 6`, `amount: { kind: roll, dice: D3 }`, `amountByKeyword: [{ targetKeyword: VEHICLE, amount: { kind: roll, dice: D3, count: 2 } }]`. Save and confirm persistence.
- [x] 4.3 Run `npm run build` in `app/` and confirm zero TypeScript errors and zero lint errors.
