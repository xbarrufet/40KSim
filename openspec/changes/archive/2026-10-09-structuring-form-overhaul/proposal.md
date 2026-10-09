# Proposal

## Why

Four accumulated issues in the ability structuring form make it harder to model rules accurately and less consistent with the app's visual design:

1. `appliedTo` lives at the ability level, but individual effects within the same ability can target different entities (e.g. one effect buffs SelfUnit, another debuffs Enemy). Moving it to the effect level removes the ambiguity and makes the Bladeguard-style rules expressible without a workaround.
2. `statModifier.target` (`unit` | `weapon`) is redundant — the stat dropdown's optgroups already separate unit stats from weapon stats. Removing the field simplifies both the schema and the form.
3. Fan-out abilities have no way to express that the player should pick exactly one (OR) instead of activating all (AND). The Bladeguard ability is impossible to model correctly today.
4. The structuring form uses hardcoded light-theme colors (`#f8f7f0`, `#f0efe8`, `#ddded0`) while the rest of the app is dark, creating a jarring visual inconsistency.

This is a **BREAKING** schema change. All existing `StructuredAbilitiesData` records will be recreated during development; no migration is needed.

## What Changes

- **`StructuredAbility.appliedTo`** — **BREAKING removed**. `AppliesTo` is now a required field on every `Effect` type.
- **`StructuringRow.appliedTo`** — **BREAKING removed** in parallel.
- **`StatModifierEffect.target`** — **BREAKING removed**. `weaponTarget` is shown in the form only when the selected stat is a `WeaponStat`.
- **All `Effect` interfaces** — gain `appliedTo: AppliesTo` (required). Effect form shows "Target" as its first field.
- **`StructuredAbility`** — gains `groupId?: string` and `groupOperator?: 'AND' | 'OR'`. `StructuringRow` gains the same fields.
- **Structuring form AND/OR selector** — shown between rows when there are 2 or more rows. Selecting OR assigns a shared UUID `groupId` and `groupOperator: 'OR'` to all rows.
- **Structuring form dark theme** — all hardcoded light CSS in `.structuring-form`, `.structuring-row*`, and `.structuring-effect-row` replaced with CSS variables.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `simulation-unit-data`: Effect types lose/gain fields; `StructuredAbility` gains group operator fields.
- `process-unit`: Effect form field order, AND/OR selector, dark theme for the structuring form.

## Impact

- `app/src/data/schema.ts` — five Effect interfaces; `StructuredAbility`
- `app/src/home/processUnitLogic.ts` — `StructuringRow`; `buildStructuredAbilities`
- `app/src/home/ProcessUnitView.tsx` — `defaultEffectForCategory`; `describeAbility`; `startEditing`; `EffectFields`; `StructuringForm` (AND/OR selector; remove ability-level appliedTo select)
- `app/src/App.css` — structuring form dark theme
