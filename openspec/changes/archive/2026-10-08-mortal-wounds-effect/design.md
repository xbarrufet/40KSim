# Design

## Context

`schema.ts` defines `Effect` as a discriminated union on `category`, currently with four members: `statModifier`, `diceModifier`, `weaponKeyword`, `damageMitigation`. Every site that consumes an `Effect` switches on `category` — `defaultEffectForCategory`, `describeEffect`, and `EffectFields` in `ProcessUnitView.tsx`.

`StructuringForm` in `ProcessUnitView.tsx` renders one `<EffectFields>` per entry in `row.effects[]`. The category `<select>` calls `defaultEffectForCategory` with the new value, replacing the entire effect with a sensible default.

`amountByKeyword` is a first-class array field on `MortalWoundsEffect` — no existing effect category has a repeatable sub-item within a single effect. This is the main structural novelty.

## Goals / Non-Goals

**Goals:**
- Add `MortalWoundsEffect` as the fifth member of the `Effect` union (schema + form + description).
- Support `amountByKeyword` as a repeatable list managed within `EffectFields` via the single `onChange` callback.

**Non-Goals:**
- Simulator evaluation logic — wired in a future change.
- `onDestroyed` or `onMove` game event UI — types defined but no form options in v1.
- Changing how `StructuringForm` itself manages rows — only `EffectFields` gains a new branch.

## Decisions

### 1. `MortalWoundsAmount` as a tagged union, not a flat object

Amount calculation varies significantly across strategies (`fixed`, `roll`, `perModelRoll`, `multiDiceCount`). A tagged union keeps TypeScript exhaustive checks tight and avoids null/undefined fields in the common case.

Alternative considered: single flat object with optional fields (`value?`, `dice?`, `count?`, `threshold?`, `onSuccess?`, `diceCount?`). Rejected — too permissive; the UI and simulator would need runtime guards for each combination.

### 2. `amountByKeyword` managed inside `EffectFields` via `onChange`

`EffectFields` receives `(effect: Effect, onChange: (e: Effect) => void)`. For `mortalWounds`, add/remove/edit of `amountByKeyword` entries calls `onChange` with the full updated effect. No additional state is needed — the parent (`StructuringForm`) already owns the effect array.

Alternative considered: lift `amountByKeyword` state out to `StructuringForm`. Rejected — no other effect needs external array state; keeping it in `EffectFields` limits the footprint of the change.

### 3. Extract `MortalWoundsAmountFields` as a local sub-component

Both the base `amount` and each `amountByKeyword[i].amount` share identical fields. A local sub-component `MortalWoundsAmountFields({ amount, onChange })` avoids duplication.

### 4. `preRoll.dice` typed as `'D3' | 'D6'`

All current patterns use D6, but the type is not locked so future rules (D3 gate rolls in faction-specific abilities) do not need a type change.

### 5. `gameEvent` type includes future values at the type level, UI restricts to v1

`MortalWoundsGameEvent` in `schema.ts` is typed as a string union including `'onDestroyed'` and `'onMove'`. The form `<select>` only offers `'onCharge'` and `'activeAbility'`. Data already structured with future values is stored and round-trips cleanly; the simulator simply skips events it does not handle.

### 6. `allUnitsWithinRange` and `movedOverUnit` included in `targetScope` type, excluded from v1 form

Same forward-compatibility rationale as `gameEvent`. Form `<select>` offers `engagedUnit` and `selectedEnemyUnit` only in v1.

## File Touchpoints

| File | Change |
|---|---|
| `app/src/data/schema.ts` | Add `MortalWoundsGameEvent`, `MortalWoundsTargetScope`, `MortalWoundsAmount`, `MortalWoundsAmountByKeyword`, `MortalWoundsPreRoll`, `MortalWoundsEffect`; add to `Effect` union |
| `app/src/home/ProcessUnitView.tsx` | `defaultEffectForCategory`: new `'mortalWounds'` case; `describeEffect`: new `'mortalWounds'` case; category `<select>`: new option; `EffectFields`: new `case 'mortalWounds'` with `MortalWoundsAmountFields` local component |
| `app/src/home/processUnitLogic.ts` | No switches on `Effect['category']` today — confirm at implementation time |

## Risks / Trade-offs

- **Complex form UI** — `EffectFields` for `mortalWounds` is the most complex branch (nested amount sub-form, repeatable `amountByKeyword` list). Risk: form becomes hard to read. Mitigation: group sub-fields visually using existing CSS patterns (`effect-section` or similar); the sub-component boundary keeps JSX manageable.
- **TypeScript exhaustiveness** — adding a union member breaks existing exhaustive switches. Risk: build fails or silent runtime errors. Mitigation: `npm run build` in the task list catches this; `processUnitLogic.ts` has no `Effect` switch today but the task explicitly checks.

## Open Questions

None — scope and approach are resolved.
