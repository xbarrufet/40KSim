# Proposal

## Why

The `type` field (`AbilityContext`: Always/AsLeader/Alone) on `StructuredAbility` and `OtherAbility` is redundant. The effect-level `appliedTo` field already determines whether an ability targets the model itself, the unit, an ally, or an enemy — which conveys the same information about context. Removing it simplifies the form and the data model.

## What Changes

- **Remove `type: AbilityContext`** from `StructuredAbility` and `OtherAbility` interfaces in `schema.ts`. Remove the `AbilityContext` type.
- **Remove "Contexto" dropdown** from the structuring form's first row.
- **Remove `type`** from `StructuringRow` in `processUnitLogic.ts` and from `buildStructuredAbilities` / `buildOtherAbility`.
- **Update `db.ts`** legacy conversion to stop setting `type`.
- **Breaking data change**: existing abilities in IndexedDB and proposals that have `type` will have a stale field. Since the field becomes absent from the interfaces, TypeScript will ignore it at runtime — no crash, but re-processing would clean it up.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `simulation-unit-data`: Remove `AbilityContext` type and `type` field from structured and OTHER abilities. Remove "Ability Types" requirement.
- `process-unit`: Remove "Contexto" dropdown from structuring form.

## Impact

- **Schema**: `AbilityContext` type removed, `type` field removed from `StructuredAbility` and `OtherAbility`.
- **ProcessUnitView.tsx**: remove Contexto `<select>`, remove `type` from structuring row defaults and ability reading.
- **processUnitLogic.ts**: remove `type` from `StructuringRow`, `buildStructuredAbilities`, `buildOtherAbility`.
- **db.ts**: remove `type` from legacy conversion.
- **No migration required**: old `type` fields in IndexedDB are harmless (ignored by TypeScript at runtime).
