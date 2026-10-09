# Proposal

## Why

The AI proposals import modal (`ProposalsImportModal`) uses CSS class names that have no definitions in the stylesheet (`modal-box`, `upload-drop-zone`, `modal-description`, `upload-file-label`, `import-result`), leaving it completely unstyled. It also imports blindly on drop without showing what will be imported or skipped, giving the user no chance to review before committing. The `UploadModal` already has a working two-phase pattern (drop → preview list → confirm) with proper styles; the proposals modal should follow the same approach.

## What Changes

- Replace all undefined CSS class names with the existing styled equivalents (`modal-content`, `drop-zone`, `file-list`, `file-entry`, etc.).
- Switch from single-phase (import-on-drop) to two-phase: **drop → preview → confirm**.
- After dropping the file, parse the JSON and query IndexedDB for each unit's current state, then show a preview list with one row per unit indicating whether it will be imported or skipped (and why).
- Replace the result-summary-after-import screen with a simple close on success, consistent with `UploadModal`.
- Add `dragging` state CSS feedback on the drop zone, matching `UploadModal`.
- Keep the `<input type="file">` fallback (already present) wired to the same two-phase flow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `faction-unit-browser`: Add a requirement for the Proposals Import Modal UX — two-phase preview + confirm, unit-by-unit status, styled with existing CSS classes.

## Impact

- `app/src/home/ProposalsImportModal.tsx` — rewritten to two-phase pattern.
- `app/src/App.css` — add one new CSS class for "skipped" row status (`.file-skip`), matching the style of the existing `.file-match` and `.file-new` classes. No other CSS changes needed.
