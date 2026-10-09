# Design

## Context

**Schema:** `StructuredAbility.appliedTo` is a single ability-level field; all effects inherit it. `StatModifierEffect.target` (`unit`|`weapon`) is separate from the stat dropdown which already groups stats by type. No group linking mechanism exists for fan-out abilities.

**Form:** `StructuringForm` in `ProcessUnitView.tsx` renders ability-level `appliedTo` as a row-level "Aplica a" select (line ~556). Effect fields are in `EffectFields` which switches on `effect.category`; `statModifier` shows a "Target" select before the stat picker. The form background is hardcoded `#f8f7f0` (light) in `App.css` line 141.

## Goals / Non-Goals

**Goals:**
- `appliedTo` required on every `Effect`; removed from `StructuredAbility` and `StructuringRow`.
- `StatModifierEffect.target` removed; `weaponTarget` shown when stat is a `WeaponStat`.
- `groupId?` + `groupOperator?` on `StructuredAbility` and `StructuringRow`; AND/OR selector in the form.
- Dark theme: all hardcoded light colors in `.structuring-form*` replaced with CSS variables.

**Non-Goals:**
- Simulator evaluation of groups (future).
- Data migration (development phase; all data recreated).

## Decisions

### 1. `appliedTo` first field in `EffectFields`, all categories

Each Effect interface gains `appliedTo: AppliesTo`. `EffectFields` renders "Target" as its first label/select, before "Categoría". Default: `'SelfModel'`. `defaultEffectForCategory` adds `appliedTo: 'SelfModel'` to every returned effect.

The ability-level `appliedTo` select in `StructuringForm` ("Aplica a") is removed. `StructuringRow.appliedTo` is removed from the interface. `buildStructuredAbilities` no longer maps it. `startEditing` no longer seeds it.

### 2. `statModifier` — remove `target`, conditionalise `weaponTarget`

`StatModifierEffect.target` removed. `EffectFields` case `'statModifier'`: drop the "Target" select; show `weaponTarget` select only when the current `effect.stat` is a member of `WeaponStat`. A helper `isWeaponStat(stat: string): boolean` checks against the known weapon stat list.

On category change to `statModifier`, `defaultEffectForCategory` returns `{ category, appliedTo: 'SelfModel', stat: 'ObjectiveControl', mode: 'add', value: 1 }` — no `target` field.

### 3. `groupId` + `groupOperator` — AND/OR selector

`StructuredAbility` and `StructuringRow` gain `groupId?: string` and `groupOperator?: 'AND' | 'OR'`.

The AND/OR selector appears in `StructuringForm` between the last row's close and the "+ Añadir otra habilidad" button, but only when `rows.length >= 2`. It controls a single `operator` value in the form state (held at `StructuringForm` level or passed via `onChangeOperator`). When changed:
- AND → clear `groupId`/`groupOperator` from all rows (call `onChangeRow` for each)
- OR → generate a UUID, set `groupId` and `groupOperator: 'OR'` on all rows

UUID generation: `crypto.randomUUID()` (available in modern browsers and Vite's target).

`buildStructuredAbilities` passes `groupId` and `groupOperator` through per row.

`startEditing` seeds `groupId` and `groupOperator` from the existing ability.

**`StructuringForm` props change:** add `onChangeOperator: (op: 'AND' | 'OR') => void` — or handle entirely inside the form with local state. Recommendation: local state inside `StructuringForm` — the operator only needs to affect the rows via `onChangeRow`, which already exists. No new prop needed. The operator is derived from `rows[0].groupOperator ?? 'AND'`.

### 4. Dark theme CSS

Replace in `App.css` lines 141–156:

| Current | Replacement |
|---|---|
| `background: #f8f7f0` (form) | `var(--panel)` |
| `background: #f0efe8` (effect row) | `var(--paper)` |
| `border: 1px solid #e1e1d6` | `var(--line)` |
| `border: 1px dashed #ddded0` | `1px dashed var(--line)` |
| `border: 1px solid #ddded0` (inputs) | `var(--line)` |
| Input/select background (unset → light system default) | `var(--panel)` with `color: var(--ink)` |

## File Touchpoints

| File | Change |
|---|---|
| `app/src/data/schema.ts` | Add `appliedTo` to all 5 Effect interfaces; remove `appliedTo` from `StructuredAbility`; remove `target` from `StatModifierEffect`; add `groupId?`/`groupOperator?` to `StructuredAbility` |
| `app/src/home/processUnitLogic.ts` | Remove `appliedTo` from `StructuringRow`; add `groupId?`/`groupOperator?`; update `buildStructuredAbilities` |
| `app/src/home/ProcessUnitView.tsx` | `defaultEffectForCategory`: add `appliedTo` to each default, remove `target` from statModifier default; `EffectFields`: "Target" first, statModifier case drops Target select + conditionalises weaponTarget; `StructuringForm`: remove ability-level "Aplica a", add AND/OR selector; `startEditing`: remove appliedTo seed, add groupId/groupOperator seed; `describeAbility`: remove `ability.appliedTo` ref (derive from effects or omit) |
| `app/src/App.css` | Dark theme for structuring form |
