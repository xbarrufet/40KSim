# Tasks

## 1. Schema

- [x] 1.1 In `app/src/data/schema.ts`, add `originalText?: string` to `StructuredAbility` after `effects`. Verify: `npm run build` in `app/` succeeds.

## 2. Commit logic

- [x] 2.1 In `ProcessUnitView.tsx`, update `commitStructuring`: after `buildStructuredAbilities(structuringRows)`, add `newAbilities[0].originalText = draft.rawAbilities[structuringIndex]?.text ?? undefined`. Verify: `npm run build` succeeds.

- [x] 2.2 In `ProcessUnitView.tsx`, update `commitEdit`: after `buildStructuredAbilities(structuringRows)`, set `newAbilities[0].originalText = (existingAbility as StructuredAbility).originalText ?? editingAbilityText ?? undefined`, where `existingAbility` is `draft.abilities[editingAbilityIndex]`. Verify: `npm run build` succeeds.

## 3. Display

- [x] 3.1 In `ProcessUnitView.tsx`, update `startEditing`: add `ability.originalText ??` as the first step in the `setEditingAbilityText` fallback chain (before `baseDataAbilitiesMap[ability.name]`). Verify: `npm run build` succeeds.

- [x] 3.2 In `ProcessUnitView.tsx`, in the reviewed collapsed row JSX, add below the `<div>` containing `<strong>{ability.name}</strong>`: `{'effects' in ability && ability.originalText && (<div className="raw-ability-text"><FormattedAbilityText text={ability.originalText} /></div>)}`. Verify: `npm run build` succeeds.

## 4. Python — auto_structure.py

- [x] 4.1 In `data/auto_structure.py`, after calling `structure_unit(...)`, build a name→rules map from `unit_data.get('abilities', [])` and add `originalText` to each generated ability whose name does not match the `(efecto N)` pattern and whose name is in the map. Verify: running `python3 auto_structure.py "Space Marines" --unit ancient` produces an `ai-abilities/ancient.json` where the abilities have `originalText` set.

## 5. Python — enrich_proposals.py

- [x] 5.1 Create `data/enrich_proposals.py`. The script accepts a faction name argument (e.g. `"Space Marines"`). It reads `<faction-slug>/structuring_proposals.json`, for each unit key loads the corresponding BaseData from `<faction-slug>/BaseData/<unit-slug>.json`, builds a name→rules map, and sets `originalText` on any structured ability that lacks it and whose name does not match `\s+\(efecto \d+\)$`. Writes the enriched proposals back to the same file. Verify: running `python3 enrich_proposals.py "Space Marines"` updates `structuring_proposals.json` with `originalText` fields and is idempotent on a second run.

## 6. End-to-end verification

- [x] 6.1 Structure a raw ability in the app. Confirm: the first reviewed entry shows the original text below the structured summary on the collapsed row. Confirm: fan-out entries (efecto 2+) do NOT show text. Screenshot both states.

- [x] 6.2 Import a proposals file enriched by `enrich_proposals.py`. Open a unit's Process Unit screen. Confirm: the reviewed collapsed row shows `originalText` from the imported proposal. Click Edit and confirm the same text appears above the form without any BaseData lookup.
