# Tasks

## 1. Create shared EffectEditor module

- [x] 1.1 Create `app/src/home/EffectEditor.tsx` with the following exports extracted from `ProcessUnitView.tsx`: `EffectFields`, `TargetConditionFields`, `WeaponSelect`, `DiceNotationInput`, `MortalWoundsHitsFields`, `MortalWoundsResolutionFields`, `CategorySelect`, `AppliedToSelect`, `defaultEffectForCategory`, `EFFECT_CATEGORY_LABELS`, `WEAPON_STATS`, `isWeaponStat`. Add optional `weaponNames?: WeaponNameEntry[]` and `compact?: boolean` props to `EffectFields`. When `compact` is true, use 0.75rem font and omit label wrappers. When `weaponNames` is absent, `WeaponSelect` shows only ALL/RANGE/MELEE. Verify: file compiles with `npm run build` from `app/`.

## 2. Refactor ProcessUnitView

- [x] 2.1 In `ProcessUnitView.tsx`, remove the internal `EffectFields`, `TargetConditionFields`, `WeaponSelect`, `DiceNotationInput`, `MortalWoundsHitsFields`, `MortalWoundsResolutionFields` components, the `defaultEffectForCategory` function, the `WEAPON_STATS`/`isWeaponStat` constants, and the `TARGET_SELECT` inline const. Import all from `./EffectEditor`. Replace `TARGET_SELECT(effect, onChange)` calls with `<AppliedToSelect>` and inline category `<select>` with `<CategorySelect>`. Verify: `npm run build` passes, `npm run lint` clean, and the Process Unit structuring form renders identically for any Space Marines unit (phase/trigger/frequency selectors, effect editing, target condition chips, weapon-specific dropdowns, mortalWounds sub-forms all functional).

## 3. Refactor DetachmentDetailView

- [x] 3.1 In `DetachmentDetailView.tsx`, remove the internal `EffectFields`, `TargetConditionFields` components, `defaultEffectForCategory`, `EFFECT_CATEGORIES`, `EFFECT_CATEGORY_LABELS`, `WEAPON_STATS` constants. Import from `./EffectEditor`. Replace `<EffectFields effect={e} onChange={...} />` with `<EffectFields effect={e} onChange={...} compact />`. Replace inline category `<select>` with `<CategorySelect compact />`. Verify: `npm run build` passes, `npm run lint` clean, and the Detachment detail view renders enhancements with effect editing. Confirm DDV now shows: hazard option in diceModifier, 9 unitTypes in mortalWounds with threshold and damagePerSuccess fields, DiceNotationInput for heal. Conditional effects still editable.

## 4. Final verification

- [x] 4.1 Run `npm run build` and `npm run lint` from `app/` — both pass with zero errors. Open dev server, navigate to Process Unit for a Space Marines unit, verify structuring form is fully functional. Navigate to a Detachment (e.g. Assault Brethren), expand an enhancement, verify effect editing works with the improved fields. Stratagems section still displays as read-only text.
