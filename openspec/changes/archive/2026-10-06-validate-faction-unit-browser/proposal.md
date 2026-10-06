# Proposal

## Why

The `faction-unit-browser` spec was migrated from a prior spec format and needs validation against the actual codebase before implementation begins. The spec describes replacing the backend-dependent admin panel (`/admin`) with a client-side-only browsing experience in the main FACTIONS tab, using IndexedDB instead of API calls. This change audits the spec for accuracy, identifies gaps and mismatches with the current code, and produces a corrective delta spec so implementation can proceed from a trusted baseline.

## What Changes

- **Audit the existing `faction-unit-browser` spec** against the admin panel code (`admin/FactionList.tsx`, `admin/FactionDetail.tsx`) and the main app (`HomeView.tsx`, `schema.ts`, `loadCatalog.ts`) to confirm the spec faithfully captures the intended migration.
- **Correct spec gaps found during reverse-engineering**:
  - `factionDetail.css` is missing from the Admin Removal file list (only `admin.css` is listed).
  - The seed file `units.json` and `UnitProfile` in `schema.ts` have no `slug` field for units — the spec assumes slugs exist for IndexedDB keys (`"<faction-slug>/<unit-slug>"`). The admin got slugs from the backend API; a seeding strategy must be specified.
  - The empty-state message in `HomeView.tsx` still references `/admin` — needs replacement text or removal.
  - The admin `FactionList` shows a status light per faction (aggregate red/yellow/green) — the spec doesn't mention faction-level status lights, only unit-level ones. Confirm whether this is intentionally dropped.
  - The admin `FactionDetail` has a "Unit Data" button per unit in edit mode — the spec replaces this with dead links to a future Process Unit screen. Confirm this mapping.
- **No behavioral additions** — this change only corrects and clarifies the existing spec.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `faction-unit-browser`: Correcting gaps in requirement details — admin removal file list, slug derivation for IndexedDB keys, empty-state text, and clarifying intentionally dropped admin features (faction-level status lights, edit mode).

## Impact

- **Spec only** — no code changes in this change. The corrected spec will be the baseline for the implementation change that follows.
- Affects: `openspec/specs/faction-unit-browser/spec.md`
