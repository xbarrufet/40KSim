# Proposal

## Why

The reviewed abilities list has two usability problems visible in the current UI: (1) every row shows a large `type` dropdown ("Always / Alone / AsLeader") that takes up horizontal space in the listing and is rarely the action the user wants at that moment — the listing should be for scanning, not for managing type; (2) OTHER-classified abilities have no edit button, so a wrong OTHER classification is permanent short of deleting the ability entirely and re-reviewing it from the raw queue.

## What Changes

- **Remove the `ability.type` select from the collapsed reviewed row.** For structured abilities the type is already editable through the structuring form's "Contexto" field. For OTHER abilities it will be editable through the new edit form described below.
- **Add "Editar" to OtherAbility rows.** Clicking it expands an inline edit state showing: an editable `<textarea>` pre-filled with `ability.text`, a "Guardar como OTHER" button (saves the updated text), and an "Estructurar" button (transitions to the existing structuring form flow with the text visible above, so the ability can be reclassified).
- The `ability.type` chip (small read-only badge) MAY be shown on each row as a compact label — this is a minor detail; the implementation can decide.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `process-unit`: MODIFIED Per-Ability Review Actions — OtherAbility rows gain an Edit action; the type dropdown is removed from the collapsed row view.

## Impact

- `app/src/home/ProcessUnitView.tsx` — reviewed ability row JSX (remove type select, add OTHER edit state and buttons).
- No schema changes, no new state shape — `editingOtherIndex: number | null` is a new piece of local state in `ProcessUnitView`.
