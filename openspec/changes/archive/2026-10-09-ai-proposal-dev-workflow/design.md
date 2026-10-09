# Design

## Context

**Script side:** `auto_structure.py` currently has a `--unit` flag that filters to one unit but still writes to (and reads from) `structuring_proposals.json`. This mixes a transient dev artefact with the reviewed faction file.

**App side:** `ProposalsImportModal` has a binary import/skip classification: skip if CONFIRMED or AI_PROPOSED, import otherwise. This makes it impossible to re-import a freshly generated single-unit file without manually resetting the unit in IndexedDB. The component also lacks per-row control — it's all-or-nothing.

## Goals / Non-Goals

**Goals:**
- `--unit` outputs to a separate `ai-abilities/<slug>.json` file; the main faction file is untouched.
- Import modal gains per-row checkboxes with a Select All toggle and default states based on the current tag.
- Confirm writes all checked rows to IndexedDB as `AI_PROPOSED`, unconditionally.

**Non-Goals:**
- Changing the full-faction (`structuring_proposals.json`) import default behaviour — unchecked CONFIRMED units are still protected by default.
- Supporting multiple files in one import session.
- Showing a diff of what changed per ability.

## Decisions

### 1. Single-unit output path: `ai-abilities/<slug>.json`

```
data/
  space-marines/
    structuring_proposals.json   <-- full faction, unchanged by --unit
    ai-abilities/
      assault-intercessors-with-jump-packs.json  <-- single-unit output
      incursor-squad.json
```

Format is identical to the main file: `{ "<faction-slug>/<unit-slug>": { tag, abilities, rawAbilities } }`. The import modal reads both files the same way — no format differentiation needed.

When `--unit` is supplied, the script skips the load/merge of `structuring_proposals.json` entirely and writes only to `ai-abilities/<slug>.json`. The `ai-abilities/` directory is created if it doesn't exist.

### 2. `UnitPreviewEntry` gains `checked` and `currentTag`

```typescript
interface UnitPreviewEntry {
  slug: string
  currentTag: 'new' | 'PENDING' | 'AI_PROPOSED' | 'CONFIRMED'
  checked: boolean   // derived from currentTag at load time
}
```

Default `checked`:
- `new`, `PENDING`, `AI_PROPOSED` → `true`
- `CONFIRMED` → `false`

### 3. Select All is a controlled checkbox with indeterminate state

A header row above the list holds a native `<input type="checkbox">` with `ref.indeterminate` set when the selection is mixed. Checking it sets all rows to `true`; unchecking sets all to `false`. Individual row toggles update only that row and recalculate the header state.

### 4. Confirm ignores tag, writes all checked rows as AI_PROPOSED

`handleConfirm` iterates `units`, skips `!entry.checked`, and calls `putStructuredAbilitiesData` for every checked entry. The data written is the value from `parsedData` unchanged — the tag in that object is already `AI_PROPOSED` (produced by the script).

### 5. CSS: one new rule for the select-all header row

`.file-list-header` — flex row matching `.file-entry` height, bold label, sits above the scrollable `<ul>`.

## File Touchpoints

| File | Change |
|---|---|
| `data/auto_structure.py` | When `--unit`: skip main-file load/merge; write to `ai-abilities/<slug>.json` |
| `app/src/home/ProposalsImportModal.tsx` | `UnitPreviewEntry` gains `checked` + `currentTag`; checkbox JSX; Select All logic; confirm rewrites all checked rows |
| `app/src/App.css` | Add `.file-list-header` rule |
