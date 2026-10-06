# Design

## Context

See proposal.md — Why. The app has two UIs to merge: a basic `HomeView` (faction cards from static JSON) and a backend-dependent admin panel (`/admin`) with faction list, unit detail, status lights. The spec requires a single IndexedDB-powered browser in the FACTIONS tab.

Current data flow: `fetch('/data/units.json')` → `UnitCatalog` object in memory → render.
Target data flow: first launch seeds IndexedDB from `/data/units.json` → all reads from IndexedDB → `baseData`/`unitData` stores populated by upload or future Process Unit screen.

Key files:
- `app/src/data/schema.ts` — TypeScript interfaces (`UnitCatalog`, `Faction`, `UnitProfile`)
- `app/src/data/loadCatalog.ts` — static fetch, schema validation
- `app/src/data/useCatalog.ts` — React hook wrapping `loadCatalog`
- `app/src/home/HomeView.tsx` — faction grid (becomes the full browser)
- `app/src/main.tsx` — admin routing (`/admin` → `AdminApp`)
- `app/src/admin/` — 8 files to delete
- `data/fetch_units.py` — scraper (already has `slug` per unit; seed file generation is out of scope — handled by `simulation-unit-data` spec)

## Goals / Non-Goals

**Goals:**
- Implement all 10 requirements of the `faction-unit-browser` spec
- Create the IndexedDB layer with 4 stores and first-launch seeding
- Build faction detail view with unit list, status lights, and upload modal
- Remove the entire admin panel

**Non-Goals:**
- Process Unit screen (dead links for now — future spec)
- UnitData generation or editing
- Service worker caching of IndexedDB data
- Backend API endpoints (fully removed)

## Decisions

### 1. IndexedDB via raw `idb`-style wrapper, no library

**Choice**: Hand-roll a thin `db.ts` module using the browser's native IndexedDB API wrapped in Promises. No `idb`, `Dexie`, or other library.

**Why**: The app has zero runtime dependencies beyond React and lucide-react. IndexedDB usage is simple (4 object stores, key-value reads/writes, no complex queries or indices). A library adds bundle weight for no benefit.

**Alternative considered**: `idb` (tiny Promise wrapper). Rejected because the wrapper we need is ~50 lines and avoids a dependency.

### 2. Component structure: two separate files

**Choice**: Two view files under `app/src/home/`:
- `FactionsView.tsx` — Faction grid grouped by category. Receives an `onSelectFaction` callback. No internal state toggle.
- `UnitsView.tsx` — Faction detail with unit list, top bar (back button, faction name, upload button), and status lights. Manages the upload modal state toggle internally.

`App.tsx` manages `selectedFaction: { slug, name } | null` state and switches between the two views within the FACTIONS tab. This keeps the navigation state at the tab level where it belongs.

**Why**: Clean separation of concerns — the faction grid and the unit list are distinct screens with different data needs and interactions. The state toggle (selected faction) lives in `App.tsx` alongside the tab state, which is the existing pattern for navigation. `UnitsView` owns its own complexity (upload modal toggle, unit status checks).

**Alternative considered**: Single `HomeView.tsx` with state toggle. Rejected because it bundles two distinct screens into one file, making each harder to reason about.

### 3. Upload modal as a separate component

**Choice**: Create `app/src/home/UploadModal.tsx` — a modal overlay with drop zone and file list. It receives the current faction's slug and unit list, handles file matching, and calls back with matched files to write to IndexedDB.

**Why**: The upload modal has enough state (dropped files, match results, create-or-skip decisions) to justify its own component. Keeping it separate from HomeView keeps each file focused.

### 4. Admin removal: delete directory, clean main.tsx

**Choice**: Delete `app/src/admin/` entirely. Simplify `main.tsx` to render `<App />` unconditionally (remove the `/admin` path check and `AdminApp` import). Remove the empty-state `/admin` reference in `HomeView.tsx`.

**Why**: Clean removal. The admin panel's useful patterns (status lights, faction detail layout) are being reimplemented from scratch in the FACTIONS tab with IndexedDB instead of API calls.

## Risks / Trade-offs

- **[Seed file empty until simulation-unit-data pipeline runs]** The current seed file has zero factions. Seed generation is handled by the `simulation-unit-data` spec (server activity). The app handles the empty-seed case gracefully (seeding runs, finds no factions, shows nothing — no crash).
- **[IndexedDB not available]** Some browsers in private mode may restrict IndexedDB. → Mitigation: The spec doesn't require offline fallbacks. The existing `loadCatalog` error handling pattern (show error alert) covers this case.
- **[No migration path]** Users of the old admin panel lose that UI. → Mitigation: The admin panel was backend-dependent and non-functional without the server. Removing it loses nothing for the PWA use case.
