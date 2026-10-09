# Proposal

## Why

During development, the AI structuring loop is: run `auto_structure.py --unit <slug>` → import into the app → review → tweak the prompt → repeat. Two friction points slow this down: `--unit` currently merges into the shared `structuring_proposals.json` (mixing dev iteration with the reviewed faction file), and the import modal skips AI_PROPOSED and CONFIRMED units (so re-running the script produces a file you can't actually import without manual IndexedDB surgery).

## What Changes

- **`auto_structure.py`** — when `--unit` is supplied, write a standalone file at `data/<faction-slug>/ai-abilities/<unit-slug>.json` instead of merging into `structuring_proposals.json`. The main full-faction flow (no `--unit`) is unchanged.

- **`ProposalsImportModal`** — replace the binary Importar/Ya-existe labels with per-row checkboxes and a "Select all" header toggle. Default: checked for New/PENDING/AI_PROPOSED units, unchecked for CONFIRMED. Confirm writes all checked rows to IndexedDB as `AI_PROPOSED`, regardless of their previous tag.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `faction-unit-browser`: Update the Proposals Import Modal requirement — per-row checkboxes with a Select All toggle, default check state per tag, overwrite behaviour on confirm.

## Impact

- `data/auto_structure.py` — conditional output path when `--unit` is set.
- `app/src/home/ProposalsImportModal.tsx` — extended `UnitPreviewEntry` type, checkbox state, Select All logic, confirm writes all checked rows.
- `app/src/App.css` — one new CSS rule for the select-all header row.
