# Design

## Context

`ProcessUnitView` manages two lists in local React state (`draft.abilities` and `draft.rawAbilities`). The structuring form (`StructuringForm`) is currently shown only for raw abilities, inline-replacing their action buttons. Reviewed structured abilities have a type-select and a "Quitar" button but no way to reopen that form.

## Goals / Non-Goals

**Goals:**
- Let the user open a pre-filled `StructuringForm` for any reviewed `StructuredAbility`.
- Remove the "Quitar" button from raw abilities — only "Estructurar" and "Marcar como OTHER" remain.

**Non-Goals:**
- Editing `OtherAbility` entries (their text is verbatim from BaseData; if wrong, re-sync corrects it).
- Multi-row edit (editing a single ability that was fanned out into multiple structured entries remains independent per row).

## Decisions

### Reuse `StructuringForm` for editing

The existing `StructuringForm` takes `rows`, `onChangeRow`, `onAddRow`, `onCancel`, `onCommit` — it has no awareness of whether it is creating or editing. We can reuse it for the edit case by:
- Tracking an `editingAbilityIndex: number | null` state alongside the existing `structuringIndex`.
- When editing, seeding `structuringRows` from the existing ability's rule (one-row form, since each reviewed entry is a single effect).
- On commit, replacing the ability at that index in `draft.abilities` instead of appending to it.

Alternative considered: a separate inline form for editing. Rejected — duplication with no benefit; `StructuringForm` already covers all rule-type fields.

### Remove `removeRawAbility`

Delete `removeRawAbility` and the "Quitar" button from the raw abilities list. The function itself can be removed from the component. There is no migration concern — any data previously removed this way is gone; the spec does not require it to be recoverable.

## Risks / Trade-offs

- A user who relied on "Quitar" to skip noise abilities must now use "Marcar como OTHER" instead. This is intentional — it keeps the review complete and auditable.
- The edit form always starts with one row (the existing rule). A fan-out ability (e.g. two effects from one raw ability) is stored as two separate reviewed entries; the user edits them independently. This is consistent with the current model.
