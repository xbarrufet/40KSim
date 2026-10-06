# Proposal

## Why

The LIST tab currently shows an always-visible paste textarea above a stacked list of detail cards (one per saved list, each expanding into every unit entry and wargear match status). As more lists get saved, that layout doesn't scale: there's no compact overview of what's stored, and the paste input takes up permanent space even when the user just wants to check or delete a saved list.

## What Changes

- Replace the stacked detail cards with a table listing saved lists: upload date, name, faction, detachment, points — one row per list, sorted by most recent upload first.
- The per-entry validation detail (unit match status, wargear tokens) shown by the current cards is dropped from this view; it is not carried over.
- Move the paste-and-submit import flow behind a "+" icon button at the top-right of the table, opening it in a modal (consistent with the existing upload modal pattern in the FACTIONS tab) instead of showing it inline at all times.
- Add an `uploadedAt` timestamp to each stored list, set every time a list is saved — including when an existing list is updated in place via URL-based dedupe — so the Date column reflects the most recent upload rather than a one-time creation date.
- The Date column is visually wider than the other columns, since it carries a full timestamp.
- Each row keeps a delete icon button (trash icon, matching the current one) on the right; deleting removes the list immediately, same as today.
- The Name column shows the list's parsed army name (`armyName`), not the current `title` field — `title` is actually just the export's own date-ish first line (e.g. "04-10"), not a human-meaningful name, so it was never fit to display as one.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `army-list-upload`: the "View and Delete Saved Lists" requirement changes from displaying full per-entry detail cards to displaying a summary table (date/name/faction/detachment/points) with per-row delete, and the import entry point moves from an always-visible paste panel to a "+"-triggered modal. The "Storage Regardless of Validation Outcome" and "Multiple Saved Lists with URL-Based Dedupe" requirements gain an `uploadedAt` timestamp that is set on every save, including dedupe-driven updates.

## Impact

- `app/src/data/schema.ts`: add `uploadedAt: string` to `ArmyList`.
- `app/src/data/parseArmyList.ts`: `saveParsedList` sets `uploadedAt` to the current time on every save (new list or dedupe update).
- `app/src/list/ListView.tsx`: restructure into a table + "+"-triggered import modal, replacing the paste panel and card stack.
- `app/src/App.css`: new table styles; reuse of existing `modal-overlay`/`modal-content` styles for the import modal.
- No IndexedDB schema/version change needed — `lists` is a schemaless object store, so adding a field to stored records doesn't require a version bump.
