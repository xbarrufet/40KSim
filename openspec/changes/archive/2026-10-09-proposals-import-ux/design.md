# Design

## Context

`ProposalsImportModal` currently uses six CSS class names that do not exist in `App.css` (`modal-box`, `upload-drop-zone`, `modal-description`, `upload-file-label`, `import-result`, and the `.dragging` variant). The modal imports all units immediately when a file is dropped, with no preview and no confirmation step.

`UploadModal` is the reference implementation: it uses `modal-content` + `drop-zone` (with `drag-over` modifier) + `file-list` / `file-entry` / `file-match` / `file-new` + `modal-actions` with Cancelar/Confirmar. All these classes are defined in `App.css`.

The main structural difference: `UploadModal` reads **multiple files** (one per unit), while `ProposalsImportModal` reads **one JSON file** containing all units as keys. The UX converges at the preview list — both show a row per unit with a status indicator.

## Goals / Non-Goals

**Goals:**
- Replace undefined CSS classes with existing styled ones.
- Add a preview phase: parse the file and query IndexedDB, then show per-unit rows before committing.
- Match `UploadModal`'s visual structure exactly (same header, drop zone, file list, footer).

**Non-Goals:**
- Allow removing individual units from the import set before confirming.
- Change the existing import logic (which units are skipped — CONFIRMED and AI_PROPOSED).
- Add progress indicators per unit during confirmation.

## Decisions

### State machine: idle → loaded → confirming

```
idle         no file yet; drop zone + disabled Confirmar
  |
  | drop / file input
  v
loaded       file parsed + IndexedDB checked; preview list visible; Confirmar enabled
  |
  | click Confirmar
  v
confirming   writes to IndexedDB; Confirmar shows "Importando…"; on finish → onImported() + onClose()
```

Alternative considered: single-phase (import on drop, same as today). Rejected — no chance to review before committing.

### IndexedDB check at load time

When the file is dropped, the component reads each unit key from the JSON and calls `getStructuredAbilitiesData` for each. Units with `tag: CONFIRMED` or `tag: AI_PROPOSED` get status `skip`; others get status `import`. This is the same logic already in `handleFile`, moved earlier so the user sees it before confirming.

Alternative considered: check at confirm time (current behaviour). Rejected — defeats the purpose of the preview.

### One new CSS class: `.file-skip`

The existing `.file-match` (green) covers "will be imported" and `.file-new` (olive bold) covers "new unit". A `.file-skip` (muted grey) is needed for "already exists — skipped". One rule added to `App.css`.

### Keep the `<input type="file">` fallback

The hidden file input with a clickable label is kept and wired to the same two-phase flow. It opens a file picker on click, identical behaviour to drag-and-drop.

## File Touchpoints

| File | Change |
|---|---|
| `app/src/home/ProposalsImportModal.tsx` | Full rewrite: new state machine, preview list, styled CSS classes |
| `app/src/App.css` | Add `.file-skip { color: var(--muted); font-size: 12px; }` |
