# Proposal

## Why

During simulation the engine will ask the player to confirm every trigger question before applying an ability's effects. Some abilities have a trigger that is de-facto always true in any meaningful game situation — e.g. "¿Deseas aumentar el golpeo de esta unidad o reducir el golpeo enemigo?" — asking it every round creates noise with no decision value. Setting the trigger to `"ALWAYS"` would silence the question but destroys the original text, losing the context of what the ability actually does.

## What Changes

- **`StructuredAbility`** gains `autoApply?: boolean`. When `true`, the simulator skips the trigger question and applies the effects immediately, identical to `trigger === "ALWAYS"`. The trigger text is preserved for display and documentation.
- **`StructuringRow`** gains the same `autoApply?: boolean` field so it flows through `buildStructuredAbilities`.
- **Structuring form** adds a toggle checkbox next to the Trigger field, labelled "Aplicar siempre (sin preguntar)". When checked, the trigger text input is disabled/greyed out to signal it is informational only.
- **`describeAbility`** reflects the `autoApply` state in the one-line summary shown on the collapsed reviewed row.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `simulation-unit-data`: `StructuredAbility` gains `autoApply?: boolean`; simulator evaluates it before showing the trigger question.
- `process-unit`: Structuring form exposes the `autoApply` toggle next to the trigger field.

## Impact

- `app/src/data/schema.ts` — one field on `StructuredAbility`.
- `app/src/home/processUnitLogic.ts` — one field on `StructuringRow`; `buildStructuredAbilities` passes it through.
- `app/src/home/ProcessUnitView.tsx` — toggle in `StructuringForm`; `describeAbility` updated; `startEditing` seeds `autoApply` from existing ability.
