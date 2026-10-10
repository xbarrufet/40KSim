# Proposal

## Why

The ability structuring form has grown organically and the mortal wounds subsystem carries fields that are redundant once phases are properly modelled. Adding the missing game phases (Movement, Charge, Command) lets us simplify the mortal-wounds data model, and several layout and UX tweaks will make the form faster to use during manual review sessions.

## What Changes

- **Add game phases**: extend the phase selector (currently `ANY | SHOOTING | FIGHT`) with `MOVEMENT`, `CHARGE`, and `COMMAND` to cover all Warhammer 40K game phases.
- **Trigger UX**: replace the "Aplicar siempre" checkbox + disabled text input with an inline toggle switch. Switch OFF = always apply (no text shown); switch ON = manual trigger (text input appears inline).
- **Form layout compaction**: reorganise the structuring form rows:
  - Row 1: Contexto, Fase, Trigger (switch + text)
  - Row 2: Target, Categoría
  - Row N: category-specific fields
- **New effect category stub**: add `heal` ("Curar") to the category dropdown as a placeholder for future development.
- **Mortal wounds rework** (**BREAKING**):
  - Remove `gameEvent` — absorbed by the new phase selector at ability level.
  - Remove `targetScope` — implicit from the selected phase (charge → engaged unit, etc.).
  - Remove `preRoll` — absorbed into the new "Resolución" field.
  - Remove `amountByKeyword` — replaced by a per-effect "Tipo Unidad" selector; users create separate effects for different unit types.
  - Replace `amount` strategies with a 3-field model: Impactos (hit count), Resolución (always/roll threshold), MW por éxito (damage per success, default fixed 1).
  - Add `unitType` field on the mortal wounds effect to filter by target unit type (Todas, Vehicle, Infantry, Monster, etc.).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `process-unit`: Update the structuring form layout (trigger UX, row compaction), add new phases, add `heal` stub category, and rework the mortal wounds form fields.
- `simulation-unit-data`: Replace `MortalWoundsEffect` fields (`gameEvent`, `preRoll`, `targetScope`, `amountByKeyword`, `MortalWoundsAmount`) with the new 3-field model (`hits`, `resolution`, `damagePerSuccess`) plus `unitType`. Extend `AttackType` with new phases. Add `heal` effect category stub.

## Impact

- **Schema**: `MortalWoundsEffect`, `MortalWoundsAmount`, `MortalWoundsAmountByKeyword`, `MortalWoundsPreRoll`, `MortalWoundsGameEvent`, `MortalWoundsTargetScope` types in `schema.ts` are replaced or removed.
- **AttackType**: extended from 3 to 6 values.
- **Effect union**: gains `HealEffect` stub.
- **ProcessUnitView.tsx**: `EffectFields` mortal wounds branch rewritten; `MortalWoundsAmountFields` component removed; `StructuringForm` layout restructured.
- **Data migration**: any existing `MortalWoundsEffect` data in IndexedDB will be incompatible with the new schema. A migration or re-processing of affected units is needed.
