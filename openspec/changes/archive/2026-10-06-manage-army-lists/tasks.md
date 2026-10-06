# Tasks

## 1. Data: upload timestamp

- [x] 1.1 Add `uploadedAt: string` to `ArmyList` in `app/src/data/schema.ts`
- [x] 1.2 In `saveParsedList` (`app/src/data/parseArmyList.ts`), set `uploadedAt` to `new Date().toISOString()` on both the new-list and dedupe-update paths before calling `putList`; verify by extending the `saveParsedList` describe block in `app/src/data/parseArmyList.test.ts` with cases asserting a new list gets an `uploadedAt`, and that re-saving with a matching `listUrl` produces a newer `uploadedAt` than the original save (e.g. by stubbing `Date` or asserting ordering between two sequential saves) — run `npm run test`

## 2. Saved lists table

- [x] 2.1 Add a `getAllFactions`-backed `slug -> name` lookup and a sorted-by-`uploadedAt`-descending table to `ListView.tsx`, with columns Date (wider), Name (`armyName`, falling back to `title`), Faction (resolved display name, falling back to the existing "Facción desconocida" text), Detachment, Points (`declaredPoints`); verify with `npm run build` (TypeScript check) and manually in `npm run dev` by saving two or more pasted lists and confirming row order and column content
- [x] 2.2 Add a per-row delete icon button (reusing the existing `Trash2` button/behavior from the current `SavedListCard`) that calls `deleteList` and refreshes the table; verify manually in `npm run dev` that deleting a row removes it and the record is gone from IndexedDB (reload the page and confirm it stays gone)
- [x] 2.3 Remove the now-unused `SavedListCard`/`SavedListEntryRow` components and their card-list rendering from `ListView.tsx`; verify with `npm run lint` (no unused symbols) and `npm run build`

## 3. Import modal

- [x] 3.1 Extract the existing paste-textarea-and-submit logic (`text`/`submitting`/`error` state, `handleSubmit`) out of the inline panel into a new `ImportListModal` component following the `UploadModal.tsx` pattern (`modal-overlay`/`modal-content`/`modal-header` with close `X`), kept in `app/src/list/` alongside `ListView.tsx`; verify with `npm run build`
- [x] 3.2 Add a "+" icon button at the top-right of the table heading in `ListView.tsx` that opens `ImportListModal`; on successful submit, close the modal and refresh the table; verify manually in `npm run dev` that pasting a valid list through the modal adds/updates a row and closes the modal, and that a parse error keeps the modal open and shows the error message

## 4. Styling

- [x] 4.1 Add table styles to `app/src/App.css` (e.g. `.saved-lists-table`) with the Date column visibly wider than Name/Faction/Detachment/Points, and style the "+" trigger button consistent with existing icon buttons; verify visually in `npm run dev` at both desktop and the existing mobile breakpoint (`App.css`'s `.workspace`/`.page-heading` mobile rules)
- [x] 4.2 Remove now-unused `.list-paste-panel`/`.saved-list-*` styles that no longer apply after tasks 2.3 and 3.1, keeping only what the modal and table still use; verify with `npm run lint` and a visual pass in `npm run dev`

## 5. Spec sync

- [x] 5.1 Confirm `openspec validate --strict` passes for this change before archive
