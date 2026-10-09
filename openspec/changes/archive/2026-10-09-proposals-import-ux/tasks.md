# Tasks

## 1. CSS

- [x] 1.1 In `app/src/App.css`, add `.file-skip { color: var(--muted); font-size: 12px; }` alongside `.file-match` and `.file-new`. Verify: class is present in the stylesheet.

## 2. ProposalsImportModal rewrite

- [x] 2.1 Replace the component state with the three-state machine from design.md: `status: 'idle' | 'loaded' | 'confirming'` plus a `units: UnitPreviewEntry[]` array (each entry: `slug`, `label`, `importStatus: 'import' | 'skip'`). Remove the old `result` and `error` state. Verify: TypeScript compiles (`npm run build` in `app/`).

- [x] 2.2 Implement `handleFile(file: File)`: parse JSON, for each key call `getStructuredAbilitiesData`, classify as `import` (no data or `PENDING`) or `skip` (`CONFIRMED` or `AI_PROPOSED`), set `status: 'loaded'` and populate `units`. Wire both the `onDrop` handler and the `<input type="file">` `onChange` to this function. Verify: `npm run build` succeeds.

- [x] 2.3 Replace the JSX: use `modal-content` instead of `modal-box`; replace `upload-drop-zone` with `drop-zone` (add `drag-over` class when dragging); render the `units` list using `file-list` / `file-entry` with `.file-match` for `import` rows and `.file-skip` for `skip` rows showing the unit slug; replace the result summary with a `modal-actions` footer (Cancelar + Confirmar disabled when `status === 'idle'`, showing "Importando…" when `status === 'confirming'`). Remove all undefined CSS class references. Verify: `npm run build` succeeds with no lint errors.

## 3. End-to-end verification

- [x] 3.1 Run the app, open Space Marines faction, click the IA button. Confirm: drop zone is visually styled (dashed border, background), dragging a file over it changes its appearance, clicking the label opens a file picker. Screenshot the idle state.

- [x] 3.2 Drop `structuring_proposals.json`. Confirm: the preview list appears showing unit slugs with green "Importar" or muted "Ya existe" labels, and the Confirmar button is enabled. Screenshot the loaded state.

- [x] 3.3 Click Confirmar. Confirm: the modal closes, the faction unit list refreshes with newly imported units showing updated status dots.
