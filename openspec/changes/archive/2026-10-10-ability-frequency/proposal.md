# Proposal

## Why

Some 40K abilities have usage limits ("Once per battle, per unit", "once per phase") that are distinct from the trigger condition. The current schema has no way to represent frequency — abilities like Haywire Mine use trigger text to convey the limit, but the simulator can't enforce it. Adding a `frequency` field lets the structuring form capture this cleanly and the simulator track usage.

## What Changes

- **New `frequency` field on `StructuredAbility`**: optional field with values `'always'` (default / absent), `'perPhase'`, `'perRound'`, `'perBattle'`. When absent or `'always'`, the ability has no usage limit.
- **Structuring form**: add a "Frecuencia" dropdown to Row 1 (Contexto, Fase, Frecuencia, Trigger), defaulting to "Siempre". Only visible values beyond "Siempre" are shown when the user changes the dropdown.
- **Data model only**: the simulator does not enforce frequency limits in v1 — the field is stored for future use.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `simulation-unit-data`: Add optional `frequency` field to `StructuredAbility` with its allowed values and semantics.
- `process-unit`: Add "Frecuencia" dropdown to the structuring form's first row.

## Impact

- **Schema**: new optional `frequency?: Frequency` field on `StructuredAbility` in `schema.ts`.
- **ProcessUnitView.tsx**: new dropdown in `StructuringForm` Row 1, update `StructuringRow` type, update `describeAbility`.
- **processUnitLogic.ts**: add `frequency` to `StructuringRow` and `buildStructuredAbilities`.
- **No migration**: field is optional and absent = always, so existing data is compatible.
