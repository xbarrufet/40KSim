# 40KSim

Warhammer 40,000 combat simulator — PWA, no backend. All runtime data in IndexedDB.

## Project structure

```
data/                              Local-only: Python-scraped raw data from 40k.app
  factions.json                    All factions by category
  fetch_factions.py                Scrape faction list
  fetch_units.py                   Scrape units for a faction (arg: faction name)
  fetch_datasheets.py              Scrape datasheets (arg: faction name or --all)
  fetch_faction_data.py            Scrape army rules (arg: faction name or --all)
  <faction-slug>/
    units.json                     Unit list (name, category, slug, points)
    faction_data.json              Army rules and detachments (Space Marines only)
    BaseData/<unit-slug>.json      Scraped datasheet per unit (Space Marines only)

app/                               Vite + React 19 + TypeScript 6
  public/data/units.json           Seed file: imported into IndexedDB on first launch
  src/
    main.tsx                       Entry point
    App.tsx                        Main shell with Factions / List / Game tabs
    data/schema.ts                 UnitCatalog TypeScript interfaces
    data/db.ts                     IndexedDB setup and access layer
    home/HomeView.tsx              Faction list + faction detail with upload
    list/ListView.tsx              Army list import (placeholder)
    game/GameView.tsx              Attacker/Defender selection + simulate (disabled)

openspec/                          OpenSpec specifications
  config.yaml                      Project context and workflow config
  specs/
    faction-unit-browser/spec.md   Faction browsing, unit list, upload modal, IndexedDB
    simulation-unit-data/spec.md   Simulation-ready unit data format and rules
  changes/                         Active OpenSpec changes
```

## Commands

```bash
# App (from app/)
npm install
npm run dev          # Dev server
npm run build        # TypeScript check + production build
npm run lint         # oxlint

# Data scripts (from repo root, need Python 3 + requests + beautifulsoup4)
python3 data/fetch_factions.py
python3 data/fetch_units.py "Space Marines"
python3 data/fetch_datasheets.py "Space Marines"
python3 data/fetch_datasheets.py --all
python3 data/fetch_faction_data.py "Space Marines"
```

## Key conventions

- No routing library — tab navigation via `useState<Tab>` in App.tsx
- No state management library — local React state only
- No CSS framework — plain CSS in `App.css`, `index.css`
- Icons from `lucide-react`
- Linting with `oxlint` (not ESLint)
- All runtime data stored in **IndexedDB** (seeded from `/data/units.json` on first launch)
- Python scripts take faction **name** as argument (e.g. "Space Marines"), not slug
- Data directory uses **slug** for paths (e.g. `space-marines/`)

## Specs

Specifications are managed with [OpenSpec](https://openspec.dev) in `openspec/specs/`. Use `/opsx:propose` to create changes, `/opsx:apply` to implement them.

## Language

The codebase mixes Spanish (README, UI labels, Python script output) and English (component names, TypeScript interfaces, Game tab UI). Follow the existing convention per context.
