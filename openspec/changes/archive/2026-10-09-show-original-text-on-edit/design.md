# Design

## Context

`startEditing` in `ProcessUnitView.tsx` sets `editingAbilityText` from `baseDataAbilitiesMap[ability.name]`. This exact-name lookup silently returns `undefined` for fanned-out abilities (whose names have an `(efecto N)` suffix) and for abilities not present in the map.

## Decision

Three-step fallback in `startEditing`, evaluated in order:

1. `baseDataAbilitiesMap[ability.name]` — exact match (current path)
2. `baseDataAbilitiesMap[baseName]` — where `baseName` strips the `(efecto N)` suffix via `/\s+\(efecto \d+\)$/`
3. `draft.rawAbilities.find(r => r.name === baseName || r.name === ability.name)?.text` — covers units still holding raw ability text in `rawAbilities`

The regex is intentionally narrow (`efecto \d+`) — it matches only the suffix appended by `addStructuringRow`, not arbitrary user-edited names.

No state changes, no schema changes, no new props. One assignment statement replaced by three lines.
