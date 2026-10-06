# Tasks

## 1. TypeScript interfaces

- [x] 1.1 Add `slug: string` to `Faction` and `UnitProfile` interfaces in `app/src/data/schema.ts`. Verify with `npm run build` that the app compiles (existing code may need updates to satisfy the new required field).

## 2. IndexedDB layer

- [x] 2.1 Create `app/src/data/db.ts` with a Promise-wrapped IndexedDB module: open/create database with 4 object stores (`factions`, `units`, `baseData`, `unitData`), expose `getDB()`, and helper functions for reading factions, units by faction slug, and checking baseData/unitData existence. Verify with `npm run build` that it compiles.
- [x] 2.2 Add a `seedFromCatalog(catalog: UnitCatalog)` function in `db.ts` that unpacks a `UnitCatalog` into the `factions` and `units` stores, using `slug` for keys. Verify with `npm run build`.
- [x] 2.3 Update `loadCatalog.ts` to: fetch `/data/units.json`, seed IndexedDB if empty, then return data from IndexedDB (not from the fetched JSON directly). Update `useCatalog.ts` to work with the new data flow (return faction list from IndexedDB). Verify with `npm run build`.

## 3. Admin removal and tab rename

- [x] 3.1 Delete the entire `app/src/admin/` directory (AdminApp.tsx, FactionList.tsx, FactionDetail.tsx, PointsPanel.tsx, JobLog.tsx, useJobPolling.ts, admin.css, factionDetail.css). Remove the admin import and `/admin` routing from `main.tsx` so it renders `<App />` unconditionally. Verify with `npm run build` that no compilation errors remain and `grep -r "admin" app/src/` returns no import references to the deleted directory.
- [x] 3.2 Rename the HOME tab to FACTIONS in `App.tsx`: change the tab type from `'home'` to `'factions'`, update the button label, and update the state default. Add `selectedFaction: { slug, name } | null` state to `App.tsx` so it switches between `FactionsView` and `UnitsView` within the FACTIONS tab. Verify by running `npm run dev` and confirming the nav shows FACTIONS, LIST, GAME.

## 4. Faction browser: list and detail views

- [x] 4.1 Create `app/src/home/FactionsView.tsx` — faction grid grouped by category. Read factions from IndexedDB (via the updated `useCatalog` hook or direct `db.ts` calls). Each card shows faction name and unit count (no status lights). Receives `onSelectFaction` callback. Remove or replace the old `HomeView.tsx`. Remove the empty-state message referencing `/admin`. Verify with `npm run dev`: faction cards appear, clicking one navigates to the units view, error state shows no `/admin` reference.
- [x] 4.2 Create `app/src/home/UnitsView.tsx` — faction detail view. Top bar with back button (calls `onBack` prop to return to faction list), faction name, and upload button. Unit list grouped by category — each row shows unit name as a link (dead `<a>` or `<span>` styled as link), points (dash if null), and a status light (red if no baseData, yellow if baseData but no unitData, green if both). Read unit data and baseData/unitData existence from IndexedDB. Manages upload modal state toggle internally. Verify with `npm run dev`: navigating to a faction shows units with red status lights (no baseData uploaded yet), back button works.

## 5. Upload modal

- [x] 5.1 Create `app/src/home/UploadModal.tsx` with a modal overlay containing a drop zone and a file list. On file drop, match each `.json` file to a unit by filename slug (e.g. `ancient.json` → slug `ancient`). Show each file with its matched unit name. For unmatched files, prompt: create new unit or skip. Cancel closes with no side effects. Verify with `npm run dev`: clicking the upload button in faction detail opens the modal, dropping files shows the match list.
- [x] 5.2 Implement the Confirm action: write all matched/accepted files to the `baseData` IndexedDB store keyed by `<faction-slug>/<unit-slug>`. For "create new unit" files, also add the unit to the `units` store. After confirm, refresh the unit list so status lights update (red → yellow for newly uploaded baseData). Verify with `npm run dev`: upload a BaseData JSON file for a known unit, confirm, and observe the status light change from red to yellow.

## 6. Build and lint verification

- [x] 6.1 Run `npm run build` from `app/` and confirm zero TypeScript errors. Run `npm run lint` and confirm no lint errors. Verify the production build completes successfully.
