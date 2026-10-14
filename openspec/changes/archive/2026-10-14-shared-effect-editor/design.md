# Design

## Context

See proposal.md for motivation. Two files contain parallel implementations of the same effect-editing UI:

- `ProcessUnitView.tsx` (1313 lines) — internal components: `EffectFields`, `TargetConditionFields`, `WeaponSelect`, `DiceNotationInput`, `MortalWoundsHitsFields`, `MortalWoundsResolutionFields`, `defaultEffectForCategory`, `WEAPON_STATS`, `isWeaponStat`, plus an inline `TARGET_SELECT` const and inline category `<select>`.
- `DetachmentDetailView.tsx` (575 lines) — internal components: `EffectFields`, `TargetConditionFields`, `defaultEffectForCategory`, `WEAPON_STATS`, `EFFECT_CATEGORIES`, `EFFECT_CATEGORY_LABELS`. Incomplete relative to PUV: missing hazard roll, only 3 generic weapon targets (no unit-specific), simplified mortalWounds (4 unitTypes, no threshold, no damagePerSuccess), plain `<input>` instead of `DiceNotationInput` for heal.

Both operate on the same `Effect` union type from `schema.ts`. The only structural difference is that PUV has access to `weaponNames: WeaponNameEntry[]` (from the unit's BaseData) while DDV has no unit context and uses generic weapon targets only. DDV also uses more compact inline styles (0.75rem font, no label wrappers).

## Goals / Non-Goals

**Goals:**
- Extract a single `EffectEditor.tsx` module that both views import
- PUV version is the baseline (complete); DDV adapts via props
- DDV gains feature parity: complete mortalWounds, hazard, DiceNotationInput
- Prepare for future stratagem structuring UI (same EffectFields component)

**Non-Goals:**
- No new CSS classes or design system changes
- No changes to data model or schema.ts
- No functional behavior changes to either view
- Not implementing the stratagem structuring UI itself

## Decisions

### 1. Single file `EffectEditor.tsx` rather than one-file-per-component

**Choice**: All shared components in one file.

**Why**: These components are tightly coupled (EffectFields renders WeaponSelect, TargetConditionFields, MortalWoundsHitsFields, DiceNotationInput internally). Splitting into 7+ files adds import overhead with no benefit — they're never imported individually. Follows existing project pattern where `processUnitLogic.ts` bundles related utilities.

**Alternative**: Separate files per component. Rejected — premature separation for components that are always used together.

### 2. Optional `weaponNames` prop on EffectFields

**Choice**: `weaponNames?: WeaponNameEntry[]` — when present, WeaponSelect shows unit-specific weapon names in optgroups; when absent, only shows ALL/RANGE/MELEE.

**Why**: This is the only real difference between PUV and DDV usage of EffectFields. DDV has no unit context (it edits detachment-level enhancements, not unit-specific data), so weapon names are unavailable. Making the prop optional with a graceful fallback preserves both behaviors without forking the component.

**Alternative**: Always require weaponNames, DDV passes empty array. Rejected — unclear intent; optional prop is self-documenting.

### 3. `compact` prop for styling variant

**Choice**: `compact?: boolean` prop on EffectFields and related components. When true: smaller font size (0.75rem), no `<label>` wrappers, inline styles matching DDV's current look.

**Why**: DDV renders effects inside a tight accordion with many items visible at once — full-size labels waste space. PUV has more room per ability. Rather than two style sheets, a boolean prop switches between labeled/unlabeled rendering.

**Alternative**: CSS class variant (`.effect-fields--compact`). Acceptable but requires new CSS; inline style toggling is simpler and matches DDV's existing approach of inline styles throughout.

### 4. PUV EffectFields as the canonical version

**Choice**: Extract PUV's EffectFields verbatim as the shared component. DDV gains its features (hazard, complete mortalWounds, DiceNotationInput for heal).

**Why**: The PUV version is strictly a superset. DDV's version was created as a quick copy that drifted behind. Promoting PUV's version ensures all effect categories are fully editable regardless of context.

**Risk**: DDV users see new options (e.g., 9 unitTypes in mortalWounds instead of 4). This is an improvement — the truncated options were a bug, not a design choice.

## Risks / Trade-offs

- **[Visual mismatch]** DDV's inline styles may clash with PUV's CSS classes for TargetConditionFields → Mitigation: the `compact` prop handles this; DDV's chip-style is replaced by PUV's more polished version. Verify visually during testing.
- **[Import size]** EffectEditor.tsx adds one file to the module graph → Mitigation: Net reduction since ~520 lines are deleted from two files. Tree-shaking handles unused exports.
