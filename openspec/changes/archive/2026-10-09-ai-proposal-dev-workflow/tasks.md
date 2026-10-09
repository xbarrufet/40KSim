# Tasks

## 1. Script — single-unit output path

- [x] 1.1 In `data/auto_structure.py`, when `args.unit` is set: skip the load of `structuring_proposals.json`; write the result to `data/<faction-slug>/ai-abilities/<unit-slug>.json` (create the `ai-abilities/` directory if needed). When `args.unit` is NOT set, the existing full-faction write to `structuring_proposals.json` is unchanged. Verify: `python3 auto_structure.py "Space Marines" --unit ancient` produces `data/space-marines/ai-abilities/ancient.json` with one key and does NOT modify `structuring_proposals.json`.

## 2. Modal — extended UnitPreviewEntry and checkbox state

- [x] 2.1 In `ProposalsImportModal.tsx`, extend `UnitPreviewEntry` with `checked: boolean` and `currentTag: 'new' | 'PENDING' | 'AI_PROPOSED' | 'CONFIRMED'`. In `handleFile`, derive `checked` from `currentTag`: `true` for `new`/`PENDING`/`AI_PROPOSED`, `false` for `CONFIRMED`. Verify: `npm run build` in `app/` succeeds.

- [x] 2.2 Add a `toggleUnit(slug: string)` handler that flips one row's `checked` state, and a `toggleAll(checked: boolean)` handler that sets all rows. Add a `useRef<HTMLInputElement>(null)` for the select-all checkbox; set `ref.current.indeterminate` in a `useEffect` whenever the mix of checked/unchecked rows changes. Verify: `npm run build` succeeds.

## 3. Modal — JSX update

- [x] 3.1 In `App.css`, add `.file-list-header { display: flex; align-items: center; gap: 10px; padding: 8px 20px; font-size: 12px; font-weight: 600; border-bottom: 1px solid var(--line); }`. Verify: class present in stylesheet.

- [x] 3.2 In `ProposalsImportModal.tsx`, replace the `<ul>` section with: a `.file-list-header` row containing the indeterminate Select All checkbox and a "Seleccionar todo" label; then the `<ul>` where each `<li>` has a checkbox (`checked={entry.checked}`, `onChange={() => toggleUnit(entry.slug)}`), the slug, and a tag label styled with the appropriate class (`.file-match` for import-able tags, `.file-skip` for CONFIRMED). Change `importCount` to count `units.filter(u => u.checked)`. Update `handleConfirm` to skip `!entry.checked` (replacing the old `importStatus === 'skip'` check). Verify: `npm run build` succeeds with no lint errors.

## 4. End-to-end verification

- [x] 4.1 Run `python3 auto_structure.py "Space Marines" --unit ancient` and confirm `data/space-marines/ai-abilities/ancient.json` exists with one key and `structuring_proposals.json` is unchanged.

- [x] 4.2 Open the app, drop `ai-abilities/ancient.json` into the IA modal. Confirm: one row appears, checked by default (ancient has no existing data), Confirmar shows `(1)`. Click Confirmar and confirm the unit appears in IndexedDB with tag `AI_PROPOSED`.

- [x] 4.3 Drop `structuring_proposals.json` (full faction). Confirm: CONFIRMED units (e.g. Assault Intercessors, Incursor Squad) are unchecked; AI_PROPOSED and new units are checked; Select All checks everything; deselecting individual rows adjusts the confirm count; the header checkbox shows indeterminate when mixed.
