# Proposal

## Why

The faction-unit-browser spec is fully validated and ready for implementation. The app currently has two separate UIs: a basic HomeView that loads factions from a static JSON via `fetch()`, and a backend-dependent admin panel (`/admin`) with faction browsing, unit lists, and status lights that relies on API calls to `/api/admin/factions`. The spec calls for replacing both with a unified IndexedDB-powered browser in the main app's FACTIONS tab, removing the admin panel entirely.

## What Changes

- **Add IndexedDB layer** (`db.ts`): Create 4 stores (`factions`, `units`, `baseData`, `unitData`) with seeding from `/data/units.json` on first launch.
- **Add `slug` to TypeScript interfaces**: Add `slug` to `Faction` and `UnitProfile` interfaces in `schema.ts`. Seed file generation with slugs is handled by the `simulation-unit-data` spec.
- **Rename HOME tab to FACTIONS** in `App.tsx`.
- **Rewrite HomeView** as the faction browser: faction cards grouped by category → click into faction detail with unit list, status lights, back button, upload button.
- **Build upload modal**: Drop zone + file list, match by slug, create-or-skip for unmatched, confirm writes to IndexedDB.
- **Remove admin panel**: Delete `app/src/admin/` directory (8 files), remove admin routing from `main.tsx`, remove `/admin` reference from empty-state text.
- **Update `loadCatalog.ts` / `useCatalog.ts`**: Replace static `fetch()` with IndexedDB reads.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

_None — the spec already covers all requirements. This change implements the existing `faction-unit-browser` spec without modifying any requirements._

## Impact

- **TypeScript interfaces**: `Faction` and `UnitProfile` in `schema.ts` gain `slug: string`. Seed file generation is out of scope (handled by `simulation-unit-data`).
- **TypeScript interfaces**: `Faction` and `UnitProfile` in `schema.ts` gain `slug: string`.
- **New dependency**: None — IndexedDB is a browser API, no packages needed.
- **Removed code**: Entire `app/src/admin/` directory (8 files), admin routing in `main.tsx`.
- **Modified files**: `main.tsx`, `App.tsx`, `HomeView.tsx`, `schema.ts`, `loadCatalog.ts`, `useCatalog.ts`, plus new `db.ts` and upload modal component.
