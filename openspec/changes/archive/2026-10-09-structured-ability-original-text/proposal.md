# Proposal

## Why

The Process Unit screen shows reviewed abilities as a compact one-line summary (`FIGHT · SelfModel · MW onCharge…`) with no way to see the original BaseData text without clicking Edit. During the structuring workflow — especially when reviewing AI-generated proposals — you need the original text in view at all times to verify the structured form is correct. Adding `originalText` directly to `StructuredAbility` makes the text self-contained and always available without runtime BaseData lookups.

## What Changes

- **`StructuredAbility`** gains `originalText?: string` — the original BaseData rules text for that ability.
- **`commitStructuring`** sets `originalText` on `newAbilities[0]` from the raw ability's text. Fan-out abilities (efecto 2+) receive no `originalText`.
- **`commitEdit`** preserves an existing `originalText` or sets it from `editingAbilityText` if absent.
- **`startEditing`** prefers `ability.originalText` as the first step in the lookup chain, before the BaseData map.
- **Reviewed collapsed row** renders `originalText` below the structured summary when present, using the existing `FormattedAbilityText` component and `raw-ability-text` CSS class.
- **`auto_structure.py`** enriches generated ability objects with `originalText` from the BaseData `rules` field (post-processing, no extra API call).
- **New `data/enrich_proposals.py`** backfills `originalText` on all existing `structuring_proposals.json` entries offline, without calling the Anthropic API. Skips abilities whose names match the `(efecto N)` fan-out pattern.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `simulation-unit-data`: `StructuredAbility` gains an optional `originalText` field.
- `process-unit`: Reviewed ability rows display `originalText` when present; structuring and edit commits set the field.

## Impact

- `app/src/data/schema.ts` — one field added to `StructuredAbility`.
- `app/src/home/ProcessUnitView.tsx` — `commitStructuring`, `commitEdit`, `startEditing`, and reviewed row JSX.
- `data/auto_structure.py` — post-process generated abilities to embed `originalText`.
- New `data/enrich_proposals.py` — one-off offline enrichment script.
