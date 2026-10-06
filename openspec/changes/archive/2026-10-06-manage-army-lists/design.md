# Design

## Context

See proposal.md - Why. Relevant current state:

- `ArmyList` (`app/src/data/schema.ts`) has no timestamp field today.
- `saveParsedList` (`app/src/data/parseArmyList.ts`) already does URL-based dedupe: it looks up an existing list by `listUrl` and, if found, keeps that record's `id` and overwrites it via `putList`; otherwise it creates a new record.
- `lists` is a plain `IDBObjectStore` with no indexes (`app/src/data/db.ts`), so adding a field to stored objects needs no version bump or migration — `getAllLists()` just returns whatever shape is in each record.
- `ListView.tsx` currently renders a textarea+button paste panel unconditionally, followed by a stack of `SavedListCard` components, each listing every entry with match status.
- `HomeView`'s `UploadModal.tsx` already establishes the modal pattern (`modal-overlay` / `modal-content` / `modal-header` / `modal-actions`) used elsewhere in the app for an upload flow triggered by a button.
- The `title` field parsed from the pasted text is the export's literal first line (e.g. `"04-10"`) — not a usable list name. `armyName` (parsed from the header line) is the actual name.

## Goals / Non-Goals

**Goals:**
- Give the LIST tab a compact table overview of saved lists instead of expanded cards.
- Move the import input behind a "+" trigger so it doesn't occupy permanent screen space.
- Track an upload timestamp per list that reflects the most recent upload (new or re-import via dedupe).

**Non-Goals:**
- No per-entry/validation detail view in this change (dropped, not deferred to a sub-component here — a future change can reintroduce it if needed).
- No change to parsing logic, matching logic, or the dedupe-by-URL behavior itself — only the timestamp is added to it.
- No IndexedDB schema/version changes.

## Decisions

**Table instead of cards, dropping per-entry detail.** The existing card already shows faction/detachment/points in its header; a table just reorganizes that same summary data into rows/columns and adds the date. Per-entry detail is dropped outright rather than built as a collapsible section, since no consumer of that detail was identified for this change — keeps the component simple (a plain table, no expand/collapse state machine).

**Reuse the existing modal pattern for import.** `UploadModal.tsx` already provides the `modal-overlay`/`modal-content` CSS and open/close convention. A new `ImportListModal` component follows the same shape (header with close `X`, body with the existing textarea+submit logic moved in, no separate footer actions since "Subir lista" is the modal's own submit button). This avoids introducing a second modal convention.

**`uploadedAt` set in `saveParsedList`, not in the caller.** `saveParsedList` is the single place both the "new list" and "dedupe update" paths converge before calling `putList`, so setting `uploadedAt: new Date().toISOString()` there (overwriting any `uploadedAt` already on the `ArmyList` passed in) guarantees it's always current on save without duplicating the timestamp logic at each call site.

**Name column reads `armyName`, falling back to `title`.** `armyName` is the correct display name; `title` is kept as a fallback only for a malformed/headerless paste where `armyName` never got set, so the row still shows something rather than a blank cell.

**Faction column resolves the display name from `factionSlug`.** `ArmyList.factionSlug` is a slug, not a display name. `ListView` already needs faction data for nothing else right now, so it fetches `getAllFactions()` once per table load and builds a `slug -> name` lookup, same pattern `HomeView` already uses when it needs faction records.

## Risks / Trade-offs

- [Dropping per-entry detail removes a feature a user might reach for] -> Low risk: no requirement or usage was identified depending on it; it's a visible, revertible UI change, not a data loss (entries stay in each list's stored record, just not rendered here).
- [`uploadedAt` added via `saveParsedList` silently overwrites any `uploadedAt` the caller might have set] -> Acceptable: `saveParsedList` is the only writer of list records, so there is no competing caller to conflict with.
