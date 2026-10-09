# Design

## Context

`StructuredAbility.trigger` is either `"ALWAYS"` (auto-apply) or a free-text question string (ask player). Changing a meaningful question to `"ALWAYS"` destroys the text. There is no way to mark "always apply, but keep the question text for documentation".

`StructuringRow` in `processUnitLogic.ts` mirrors `StructuredAbility`'s fields and is the in-form state. `buildStructuredAbilities` maps rows → abilities.

The structuring form renders the trigger as a plain `<input>` at line 562 in `ProcessUnitView.tsx`.

## Goals / Non-Goals

**Goals:**
- Add `autoApply?: boolean` to both `StructuredAbility` and `StructuringRow`.
- Checkbox toggle next to the Trigger input; when checked, disables the input.
- `buildStructuredAbilities` passes `autoApply` through.
- `startEditing` seeds `autoApply` from the existing ability.
- `describeAbility` shows a visual marker when `autoApply` is true.

**Non-Goals:**
- Simulator evaluation logic (future change when the simulator is built).
- Auto-detecting which trigger questions are always-true.
- Changing the `"ALWAYS"` sentinel — it still works independently.

## Decisions

### 1. `autoApply` on `StructuringRow` (not just `StructuredAbility`)

The form state (`StructuringRow`) must carry `autoApply` so the toggle can be controlled from form state without needing a separate piece of state. `buildStructuredAbilities` already maps each row field to the ability; adding `autoApply` follows the same pattern.

### 2. Disabled trigger input when `autoApply: true`

Disabling the input visually signals "this text is documentation only, the simulator ignores it". The text is still editable if the user unchecks the toggle. No separate `triggerText` field needed.

### 3. `describeAbility` marker

When `autoApply: true`, the one-line summary on the collapsed row changes the trigger segment to `[AUTO]` instead of `[<trigger text>]`. This makes it clear at a glance that the simulator will auto-apply this rule.

### 4. Default: `autoApply` absent / `false`

New abilities default to `undefined` (behaves like `false`). Existing abilities without the field are unaffected — the field is optional.

## File Touchpoints

| File | Change |
|---|---|
| `app/src/data/schema.ts` | Add `autoApply?: boolean` to `StructuredAbility` |
| `app/src/home/processUnitLogic.ts` | Add `autoApply?: boolean` to `StructuringRow`; pass through in `buildStructuredAbilities` |
| `app/src/home/ProcessUnitView.tsx` | Toggle checkbox in `StructuringForm`; `describeAbility` marker; `startEditing` seeds `autoApply` |
