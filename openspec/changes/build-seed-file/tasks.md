# Tasks

## 1. Make UnitProfile arrays optional

- [ ] 1.1 In `app/src/data/schema.ts`, change `keywords`, `models`, `weapons`, `abilities` from required to optional (`?`) on `UnitProfile`. Update `db.ts`'s `seedFromCatalog` to use `unit.keywords ?? []` when reading keywords. Verify with `npm run build`.

## 2. Create build script

- [ ] 2.1 Create `data/build_seed.py` that reads `data/factions.json` and each `data/<slug>/units.json` to produce `app/public/data/units.json` in `UnitCatalog` format. Each faction gets `id` (same as slug), `slug`, `name`, `category` (from factions.json grouping). Each unit gets `id` (same as slug), `slug`, `name`, `points` (parsed as int or omitted if null). Verify by running the script and checking the output has `schemaVersion: 1` and populated factions.
- [ ] 2.2 Run `python3 data/build_seed.py` and verify the generated `app/public/data/units.json` contains 36 factions with units, each faction has `slug`, each unit has `slug`.

## 3. Verify the app loads the seed

- [ ] 3.1 Run `npm run build` and `npm run lint` from `app/` — zero errors. Run `npm run dev` and verify the FACTIONS tab shows all 36 factions grouped by category with unit counts.
