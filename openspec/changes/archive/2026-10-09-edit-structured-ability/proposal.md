# Proposal

## Why

Once a structured ability (with a `rule`) is added to the reviewed list, there is no way to correct its rule — the only option is to delete it, losing work. Additionally, raw abilities offer a "Quitar" (remove without classifying) button that bypasses the review intent, allowing abilities to silently disappear rather than be either structured or marked as OTHER.

## What Changes

- **Add** an edit action on reviewed structured abilities: opens the same structuring form pre-filled with the existing rule so the user can correct or refine it.
- **Remove** the "Quitar" button from raw abilities in the unreviewed queue — the only actions on a raw ability are "Estructurar" (structure) and "Marcar como OTHER".

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `process-unit`: The per-ability review actions change — raw abilities lose the remove option; structured reviewed abilities gain an edit action.

## Impact

- `app/src/home/ProcessUnitView.tsx`: add edit flow for structured reviewed abilities; remove `removeRawAbility` call and its button.
- `openspec/specs/process-unit/spec.md`: update the Per-Ability Review Actions requirement to reflect the two-option raw ability flow; add a new Edit Structured Ability requirement.
