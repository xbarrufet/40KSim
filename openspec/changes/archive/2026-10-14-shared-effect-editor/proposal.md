# Proposal

## Why

`ProcessUnitView.tsx` and `DetachmentDetailView.tsx` contain nearly identical internal components for editing structured effects (~520 lines duplicated total). The DetachmentDetailView copy is incomplete — missing `hazard` roll, `DiceNotationInput` for heal, and a truncated mortalWounds editor (4 unitTypes vs 9, no threshold, no damagePerSuccess). Extracting a shared component eliminates the duplication, fixes DDV's gaps, and prepares reuse for the upcoming stratagem structuring UI (per the unified-rule-pattern spec).

## What Changes

- **Create `app/src/home/EffectEditor.tsx`** — new shared module exporting all effect-editing components: `EffectFields`, `TargetConditionFields`, `WeaponSelect`, `DiceNotationInput`, `MortalWoundsHitsFields`, `MortalWoundsResolutionFields`, `CategorySelect`, `AppliedToSelect`, plus utilities `defaultEffectForCategory`, `EFFECT_CATEGORY_LABELS`, `WEAPON_STATS`, `isWeaponStat`
- **Refactor `ProcessUnitView.tsx`** — remove ~320 lines of internal components, import from `EffectEditor`
- **Refactor `DetachmentDetailView.tsx`** — remove ~200 lines of internal components, import from `EffectEditor` with `compact` prop. DDV gains complete mortalWounds, hazard roll, and DiceNotationInput for heal
- No changes to `schema.ts`, no new functionality, no CSS changes

## Capabilities

### New Capabilities

_(none — this is a pure refactor)_

### Modified Capabilities

_(none — no spec-level behavior changes; `skip_specs: true` is set)_

## Impact

- **Files modified**: `ProcessUnitView.tsx`, `DetachmentDetailView.tsx`
- **Files created**: `EffectEditor.tsx`
- **No API/data/schema changes** — only UI component extraction
- **Side-effect improvement**: DetachmentDetailView enhancement editor gains feature parity with ProcessUnitView (complete mortalWounds, hazard roll, DiceNotationInput)
