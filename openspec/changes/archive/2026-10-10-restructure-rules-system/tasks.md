# Tasks

## 1. Schema types update

- [x] 1.1 Rename `AttackType` to `Phase` in `schema.ts`, add `MOVEMENT`, `CHARGE`, `COMMAND` values, rename `attackType` field to `phase` on `StructuredAbility`. Verify `npm run build` passes with no type errors.
- [x] 1.2 Replace `MortalWoundsEffect` and its sub-types (`MortalWoundsGameEvent`, `MortalWoundsTargetScope`, `MortalWoundsPreRoll`, `MortalWoundsAmount`, `MortalWoundsAmountByKeyword`) with new types: `MortalWoundsHits`, `MortalWoundsResolution`, `MortalWoundsDamage`, `MortalWoundsUnitType`, and new `MortalWoundsEffect` containing `unitType`, `hits`, `resolution`, `damagePerSuccess`. Verify `npm run build` passes.
- [x] 1.3 Add `HealEffect` stub type (`{ category: 'heal'; appliedTo: AppliesTo }`) and include it in the `Effect` union. Verify `npm run build` passes.

## 2. ProcessUnitView form logic

- [x] 2.1 Update `defaultEffectForCategory` to handle the new `mortalWounds` shape (unitType=ALL, hits=fixed 1, resolution=always, damagePerSuccess=fixed 1) and new `heal` category. Update `describeEffect` and `describeAbility` for the new types and `phase` field. Verify `npm run build` passes.
- [x] 2.2 Update the phase selector in `StructuringForm` from 3 options (Cualquiera/Disparo/Combate) to 6 options (Cualquiera/Movimiento/Disparo/Carga/Combate/Mando). Update the `StructuringRow` type in `processUnitLogic.ts` to use `phase` instead of `attackType`. Verify `npm run build` passes and all 6 options appear in the dropdown.
- [x] 2.3 Replace the trigger checkbox + disabled input with a toggle switch. Switch OFF = trigger "ALWAYS" + autoApply true (no text input visible). Switch ON = text input inline. Layout horizontal on one line. Verify toggling shows/hides the text input and the correct values are stored.
- [x] 2.4 Reorganise `StructuringForm` layout: Row 1 = Contexto + Fase + Trigger (toggle + text), Row 2 = Target + Categoría, Row N = category-specific fields. Move `TARGET_SELECT` and category `<select>` into a shared row. Verify visual layout matches spec.

## 3. Mortal wounds form fields

- [x] 3.1 Rewrite the `mortalWounds` case in `EffectFields` component with the new sub-fields: Tipo Unidad dropdown, Impactos (Fijo/Por Stats/Tirada), Resolución (Siempre/Tirada), MW por éxito (Fijo/Tirada). Remove `MortalWoundsAmountFields` component. Verify all field combinations render correctly and produce valid effect data.
- [x] 3.2 Add `heal` case to `EffectFields` that renders no category-specific fields beyond Target. Verify selecting "Curar" shows only the Target and Category dropdowns.

## 4. Supporting code updates

- [x] 4.1 Update `processUnitLogic.ts`: rename `attackType` references to `phase` in `StructuringRow`, `buildStructuredAbilities`, and any helper functions. Verify `npm run build` passes.
- [x] 4.2 Update CSS in `App.css` for the new form layout (row grouping, toggle switch styling, compact rows). Verify the form renders cleanly on desktop and iOS Safari viewport widths.

## 5. Integration verification

- [x] 5.1 Run `npm run build` and `npm run lint` with zero errors. Start dev server, navigate to a unit's Process Unit screen, create a mortal wounds effect with each combination (Fijo/Por Stats/Tirada × Siempre/Tirada × Fijo/Tirada), save, and verify the data round-trips correctly.

## Workflow follow-up

- Archive the change after verifying all task groups.
