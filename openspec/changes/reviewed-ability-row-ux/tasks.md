# Tasks

## 1. Remove type dropdown from collapsed reviewed row

- [x] 1.1 In `app/src/home/ProcessUnitView.tsx`, remove the `<select>` that renders `ability.type` (the "Always / Alone / AsLeader" dropdown) from the collapsed reviewed ability row JSX. Also remove the `updateReviewedAbilityType` handler call from the onChange. Verify: `npm run build` in `app/` succeeds. Confirm the dropdown no longer appears on any reviewed row in the running app.

## 2. Add edit state and "Editar" for OTHER abilities

- [x] 2.1 In `ProcessUnitView.tsx`, add `editingOtherIndex: number | null` state (initialized to `null`). Add a `startEditingOther(index: number)` handler that sets this state. Add a `cancelEditingOther()` handler that clears it. Verify: `npm run build` succeeds.

- [x] 2.2 In the reviewed ability row JSX, add an "Editar" button for OTHER abilities: `{'category' in ability && ability.category === 'OTHER' && (<button type="button" onClick={() => startEditingOther(index)}>Editar</button>)}`. Verify: `npm run build` succeeds; the button appears on OTHER rows in the running app.

- [x] 2.3 In the reviewed ability row JSX, when `editingOtherIndex === index`, replace the collapsed row content with an inline edit form:
  - A `<textarea>` pre-filled with `ability.text`, controlled via local draft or a separate `editingOtherText: string` state piece
  - A "Guardar como OTHER" button: saves the updated text as `{ type: ability.type, name: ability.name, category: 'OTHER', text: editingOtherText }` at the same index; calls `cancelEditingOther()`
  - A "Estructurar" button: transitions to the existing structuring form flow — sets `editingAbilityIndex = index`, `editingAbilityText = editingOtherText`, seeds `structuringRows` from the ability name (empty effects), calls `cancelEditingOther()`
  - A "Cancelar" button: calls `cancelEditingOther()`
  Verify: `npm run build` succeeds with no lint errors.

## 3. End-to-end verification

- [x] 3.1 Open the Process Unit screen. Confirm: no "Always" dropdown visible on any reviewed ability row (structured or OTHER). Screenshot the reviewed list.

- [x] 3.2 Click "Editar" on an OTHER ability. Confirm: an inline form appears with editable text, "Guardar como OTHER", "Estructurar", and "Cancelar" buttons. Edit the text and save — confirm the text updates. Screenshot the edit state.

- [x] 3.3 Click "Editar" on an OTHER ability, then click "Estructurar". Confirm: the structuring form opens with the ability text visible above it. Commit a structured ability — confirm the OTHER is replaced by the new structured entry at the same list position.
