# Proposal

## Why

Several unit abilities deal mortal wounds through mechanisms that have no structured representation today — they end up as `OTHER` (display-only) even though their game effect is fully mechanically specifiable. Adding a `mortalWounds` effect category allows the simulator to evaluate charge-triggered and player-activated mortal wound abilities without manual approximation.

## What Changes

- **New effect category `mortalWounds`** added to the `Effect` union in `schema.ts`, with its own TypeScript interfaces (`MortalWoundsEffect`, `MortalWoundsAmount`, `MortalWoundsPreRoll`, `MortalWoundsAmountByKeyword`).
- **Two game events supported in v1**:
  - `onCharge` — mortal wounds dealt when this unit ends a charge (e.g. Hammer of Wrath).
  - `activeAbility` — player-activated ability in a phase (e.g. Haywire Mine).
- **Deferred to v2**: `onDestroyed` (Deadly Demise) and `onMove` (movement-phase abilities).
- **Four amount calculation strategies**: `fixed`, `roll` (dice × count + modifier), `perModelRoll` (each model rolls against a threshold), `multiDiceCount` (roll N dice, count successes).
- **Optional gate roll** (`preRoll`): roll D3 or D6, proceed only on threshold+ (e.g. Haywire Mine: D6, 2+).
- **Keyword-based amount overrides** (`amountByKeyword`): list of `{ targetKeyword, amount }` resolved most-restrictive-first — first matching keyword on the target unit wins (e.g. Haywire Mine deals 2D3 vs VEHICLE instead of D3).
- **Structuring form** in `ProcessUnitView` gains a "Heridas Mortales" category option with all sub-fields for the new effect type.

## Capabilities

### New Capabilities

None — mortal wounds extend the existing structured ability rule framework.

### Modified Capabilities

- `simulation-unit-data`: Rule Types requirement gains a new `mortalWounds` category with its schema and simulation flow. Scenarios added for each v1 pattern (per-model charge roll, active shooting ability with keyword override).
- `process-unit`: Structuring an ability section gains support for the `mortalWounds` effect category in the per-ability review form.

## Impact

- `app/src/data/schema.ts` — new types and updated `Effect` union.
- `app/src/home/ProcessUnitView.tsx` — new form fields (`defaultEffectForCategory`, `describeEffect`, `StructuringForm` render branch).
- `app/src/home/processUnitLogic.ts` — any logic that switches on `Effect['category']` needs a `mortalWounds` branch.
- Future simulator: new evaluation hook for `onCharge` and `activeAbility` game events, interacting with the target unit's `damageMitigation fnp vsMortalWounds` defence.
