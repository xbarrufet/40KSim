# Tasks

## 1. Remove raw-ability delete option

- [x] 1.1 Remove the `removeRawAbility` function and its "Quitar" button from the raw abilities list in `ProcessUnitView.tsx` — verify no delete button appears for raw abilities in the browser and `npm run lint` passes.

## 2. Add edit flow for structured reviewed abilities

- [x] 2.1 Add `editingAbilityIndex: number | null` state to `ProcessUnitView` — verify the initial value is `null` and the component renders without errors.
- [x] 2.2 Implement `startEditing(index)`: sets `editingAbilityIndex` and seeds `structuringRows` from the reviewed ability's rule (single-row, pre-filled) — verify the form opens with the correct values when the edit button is clicked.
- [x] 2.3 Implement `commitEdit()`: replaces `draft.abilities[editingAbilityIndex]` with the updated structured ability from `structuringRows` and clears `editingAbilityIndex` — verify saving the form updates the rule in the list and the position is preserved.
- [x] 2.4 Wire `cancelStructuring` (or a shared cancel handler) to clear `editingAbilityIndex` — verify cancelling leaves the ability unchanged.
- [x] 2.5 Render an "Editar" button next to each `StructuredAbility` in the reviewed list (not next to `OtherAbility`); inline-replace it with `StructuringForm` while `editingAbilityIndex === index` — verify `OtherAbility` rows show no edit button and structured rows show the form inline when editing.

## 3. Build verification

- [x] 3.1 Run `npm run build` from `app/` and confirm it completes without TypeScript errors.

## Workflow follow-up

- Archive the change once implementation is confirmed working.
