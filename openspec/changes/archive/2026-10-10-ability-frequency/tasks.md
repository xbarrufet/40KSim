# Tasks

## 1. Schema type

- [x] 1.1 Add `Frequency` type (`'always' | 'perPhase' | 'perRound' | 'perBattle'`) and optional `frequency?: Frequency` field to `StructuredAbility` in `schema.ts`. Verify `npm run build` passes.

## 2. Form integration

- [x] 2.1 Add `frequency` to `StructuringRow` in `processUnitLogic.ts` and map it through `buildStructuredAbilities`. Default to `undefined` (= always). Verify `npm run build` passes.
- [x] 2.2 Add "Frecuencia" dropdown to the structuring form's first descriptor row (after Fase, before Trigger). Options: Siempre/1 por fase/1 por ronda/1 por partida. Store `undefined` for 'always', the string value otherwise. Verify `npm run build` passes.
- [x] 2.3 Update `describeAbility` to show frequency in the summary when not 'always' (e.g. `[1/partida]`). Update `startEditing` to read `frequency` from the ability into the structuring row. Verify `npm run build` passes.

## 3. Verification

- [x] 3.1 Run `npm run build` and `npm run lint` with zero errors. Start dev server, create an ability with frequency "1/partida", save, re-open edit, and verify the frequency persists.

## Workflow follow-up

- Archive the change after verifying all task groups.
