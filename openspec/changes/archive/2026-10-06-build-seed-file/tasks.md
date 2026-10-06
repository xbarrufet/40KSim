# Tasks

## 1. TypeScript interfaces and IndexedDB updates

- [x] 1.1 Add `icon?: string` to `Faction` in `schema.ts`. Add `icon?: string` to `FactionRecord` in `db.ts`. Update `seedFromCatalog` to store the icon field and to only seed the `factions` store (skip writing to `units` when `faction.units` is empty). Verify with `npm run build`.
- [x] 1.2 Make `keywords`, `models`, `weapons`, `abilities` optional (`?`) on `UnitProfile` in `schema.ts`. Update `seedFromCatalog` to use `unit.keywords ?? []` when reading keywords. Verify with `npm run build`.
- [x] 1.3 Add `getBaseDataCount(factionSlug: string)` and `getUnitDataCount(factionSlug: string)` helpers to `db.ts` that count keys starting with `<factionSlug>/` in the respective stores. Verify with `npm run build`.

## 2. Build seed script

- [x] 2.1 Create `data/build_seed.py` that reads `data/factions.json` and produces `app/public/data/units.json` in `UnitCatalog` format. Each faction gets `id` (same as slug), `slug`, `name`, `category` (from factions.json grouping), `icon` (`/icons/<slug>-icon.svg`), and `units: []`. Verify by running the script and checking the output has 36 factions with empty units arrays and icon paths.
- [x] 2.2 Run `python3 data/build_seed.py` and verify the generated seed file is valid JSON with 36 factions.

## 3. Faction card counters

- [x] 3.1 Update `FactionsView.tsx` to show BaseData/UnitData counts on each faction card. Load counts via the new `db.ts` helpers. Display as `N base / M processed` in smaller text below the faction name. Also render the faction icon as an `<img>` with `onError` handler that hides it on failure. Add the necessary CSS. Verify with `npm run dev`: faction cards show "0 base / 0 processed" (no data uploaded yet) and no broken icon images.

## 4. Simplify upload modal

- [x] 4.1 Update `UploadModal.tsx` to auto-create units on confirm: remove the create/skip toggle. On confirm, every file gets its unit created if it doesn't exist, then baseData is stored. The file list shows `→ <unit name>` for existing units and `+ new` for units that will be created. Verify with `npm run dev`: drop BaseData files, confirm, units appear in the unit list with yellow status lights.

## 5. Build and lint verification

- [x] 5.1 Run `npm run build` and `npm run lint` from `app/` — zero errors. Verify the production build completes successfully.
