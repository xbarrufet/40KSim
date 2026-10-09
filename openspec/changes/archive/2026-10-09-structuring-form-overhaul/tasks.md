# Tasks

## 1. Schema — `appliedTo` to effects, remove ability-level field

- [x] 1.1 In `app/src/data/schema.ts`, add `appliedTo: AppliesTo` to `StatModifierEffect`, `DiceModifierEffect`, `WeaponKeywordEffect`, `DamageMitigationEffect`, and `MortalWoundsEffect`. Remove `appliedTo` from `StructuredAbility`. Verify: `npm run build` in `app/` reports only type errors caused by removed `appliedTo` references (expected — fixed in later tasks).

## 2. Schema — remove `statModifier.target`, add group operator

- [x] 2.1 In `app/src/data/schema.ts`, remove `target: 'unit' | 'weapon'` from `StatModifierEffect`. Add `groupId?: string` and `groupOperator?: 'AND' | 'OR'` to `StructuredAbility`. Verify: no new compile errors beyond those from task 1.1.

## 3. processUnitLogic — update `StructuringRow` and `buildStructuredAbilities`

- [x] 3.1 In `processUnitLogic.ts`, remove `appliedTo` from `StructuringRow`. Add `groupId?: string` and `groupOperator?: 'AND' | 'OR'`. In `buildStructuredAbilities`, remove the `appliedTo` mapping; add `groupId: row.groupId, groupOperator: row.groupOperator`. Verify: `npm run build` succeeds (all prior type errors from 1.1 should now resolve or reduce).

## 4. ProcessUnitView — `defaultEffectForCategory` and `describeAbility`

- [x] 4.1 In `ProcessUnitView.tsx`, update `defaultEffectForCategory`: add `appliedTo: 'SelfModel'` to every returned effect; for `'statModifier'`, remove the `target` field from the default object. Verify: `npm run build` succeeds.

- [x] 4.2 In `ProcessUnitView.tsx`, update `describeAbility`: its signature currently references `ability.appliedTo`; remove that reference and update the return string to omit the ability-level target (effect-level targets are now on each effect). Verify: `npm run build` succeeds.

## 5. ProcessUnitView — `startEditing` and form init

- [x] 5.1 In `ProcessUnitView.tsx`, update `startEditing`: remove `appliedTo: ability.appliedTo` from the `setStructuringRows` call; add `groupId: ability.groupId, groupOperator: ability.groupOperator`. Also update the fan-out row init (line ~255) to remove `appliedTo`. Verify: `npm run build` succeeds.

## 6. ProcessUnitView — `EffectFields` Target first field + statModifier cleanup

- [x] 6.1 In `ProcessUnitView.tsx`, in `EffectFields`, add a "Target" `<label>/<select>` for `appliedTo` as the **first element** of the return fragment for ALL categories (before any category-specific fields). The select has options: SelfModel | SelfUnit | Aliado | Enemigo. It reads `effect.appliedTo` and calls `onChange({ ...effect, appliedTo: ... })`. Verify: `npm run build` succeeds.

- [x] 6.2 In `ProcessUnitView.tsx`, in `EffectFields` case `'statModifier'`: remove the "Target" (`target: unit|weapon`) select entirely. Replace the `effect.target === 'weapon'` conditional that shows `weaponTarget` with a check against `isWeaponStat(effect.stat)`. Add a helper `const WEAPON_STATS = new Set(['Strength','Damage','Range','Attacks','AP','Skill'])` and `function isWeaponStat(s: string) { return WEAPON_STATS.has(s) }` near the top of the file. Verify: `npm run build` succeeds with no lint errors.

## 7. ProcessUnitView — `StructuringForm` ability-level "Aplica a" removal

- [x] 7.1 In `ProcessUnitView.tsx`, in `StructuringForm`, remove the "Aplica a" `<label>/<select>` for `row.appliedTo` from the `structuring-row-descriptors` div. Verify: `npm run build` succeeds.

## 8. ProcessUnitView — AND/OR selector

- [x] 8.1 In `ProcessUnitView.tsx`, in `StructuringForm`, add an AND/OR selector rendered between the last row's block and the "+ Añadir otra habilidad" button, visible only when `rows.length >= 2`. Derive the current value from `rows[0]?.groupOperator ?? 'AND'`. On change:
  - AND: call `onChangeRow(i, { groupId: undefined, groupOperator: undefined })` for all rows.
  - OR: generate `const id = crypto.randomUUID()`, call `onChangeRow(i, { groupId: id, groupOperator: 'OR' })` for all rows.
  Verify: `npm run build` succeeds.

## 9. App.css — dark theme

- [x] 9.1 In `app/src/App.css`, replace hardcoded light colors in `.structuring-form`, `.structuring-row`, `.structuring-row-name`, `.structuring-row-descriptors`, and `.structuring-effect-row` with CSS variables: `#f8f7f0` → `var(--panel)`, `#f0efe8` → `var(--paper)`, `#e1e1d6` and `#ddded0` → `var(--line)`. For `input` and `select` inside these classes, add `background: var(--panel); color: var(--ink);`. Verify: `npm run build` succeeds; the structuring form visually matches the dark theme.

## 10. End-to-end verification

- [x] 10.1 Open the Process Unit screen. Structure an ability. Confirm: no "Aplica a" at the ability/row level; "Target" is the first field in each effect row; statModifier shows no "Target (unit/weapon)" select; weaponTarget appears only when a weapon stat is selected. Screenshot.

- [x] 10.2 Fan out two rows. Confirm: AND/OR selector appears; switching to OR assigns a shared groupId visible in IndexedDB after saving; switching back to AND clears it. Screenshot both states.

- [x] 10.3 Structure the Bladeguard ability as an OR group with Effect A (diceModifier, addToRoll, appliedTo: SelfUnit) and Effect B (diceModifier, subtractFromRoll, appliedTo: Enemy). Save and confirm the data in IndexedDB matches the designed structure.

- [x] 10.4 Confirm the structuring form renders on the dark background with no light-colored boxes or inputs. Screenshot.
