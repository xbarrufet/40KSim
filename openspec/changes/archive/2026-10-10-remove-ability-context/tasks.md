# Tasks

## 1. Schema cleanup

- [x] 1.1 Remove `AbilityContext` type and `type: AbilityContext` from `StructuredAbility` and `OtherAbility` in `schema.ts`. Verify `npm run build` reports errors only in files we'll fix next.

## 2. Code updates

- [x] 2.1 Remove `AbilityContext` import and `type` from `StructuringRow`, `buildStructuredAbilities`, and `buildOtherAbility` in `processUnitLogic.ts`. Remove `type` from legacy conversion in `db.ts`. Verify `npm run build` passes after also updating ProcessUnitView.
- [x] 2.2 Remove `AbilityContext` import, the "Contexto" `<select>` from `StructuringForm`, and all `type` references in `startStructuring`, `structureFromOther`, `startEditing`, `commitEdit`, `markEditingAbilityAsOther`, `markAsOther`, and row defaults in `ProcessUnitView.tsx`. Verify `npm run build` and `npm run lint` pass.

## 3. Verification

- [x] 3.1 Run `npm run build` and `npm run lint` with zero errors. Start dev server, open a unit's Process Unit screen, verify the form has no "Contexto" dropdown and abilities save correctly.

## Workflow follow-up

- Archive the change after verifying all task groups.
