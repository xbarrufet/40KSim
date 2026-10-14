# 40KSim

Warhammer 40,000 combat simulator — PWA, no backend. All runtime data in IndexedDB.

## Project structure

```
data/                              Local-only: Python-scraped raw data from 40k.app
  factions.json                    All factions by category
  fetch_factions.py                Scrape faction list
  fetch_units.py                   Scrape units for a faction (arg: faction name)
  fetch_datasheets.py              Scrape datasheets (arg: faction name or --all)
  fetch_faction_data.py            Scrape army rules + detachments (arg: faction name or --all)
  auto_structure_all.py             AI: genera propuestas de abilities + enhancements (unificado)
  auto_loadout.py                  AI: genera propuestas de loadout estructurado
  auto_structure.py                DEPRECATED: usar auto_structure_all.py --mode abilities
  auto_structure_enhancements.py   DEPRECATED: usar auto_structure_all.py --mode enhancements
  seed_supabase.py                 Sube datos a Supabase (--faction, --detachments-only, etc.)
  <faction-slug>/
    units.json                     Unit list (name, category, slug, points)
    faction_data.json              Army rules and detachments
    BaseData/<unit-slug>.json      Scraped datasheet per unit
    structuring_proposals.json     AI ability proposals (auto_structure.py output)
    loadout_proposals.json         AI loadout proposals (auto_loadout.py output, batch)
    ai-loadout/<unit-slug>.json    AI loadout proposals (auto_loadout.py --unit output)
    enhancement_proposals.json     AI enhancement proposals (auto_structure_enhancements.py)

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
    structured-loadout/spec.md     Loadout data format, AI pipeline, approve/reject flow
    supabase-data-layer/spec.md    Supabase tables, client functions, write semantics
    process-unit/spec.md           Process Unit screen: abilities + loadout review
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

# AI structuring (need anthropic: pip install "anthropic[bedrock]")
# Script unificado para abilities + enhancements
python3 data/auto_structure_all.py "Space Marines"                        # todo (abilities + enhancements + hijos)
python3 data/auto_structure_all.py "Space Marines" --mode abilities       # solo abilities
python3 data/auto_structure_all.py "Space Marines" --mode enhancements    # solo enhancements
python3 data/auto_structure_all.py "Space Marines" --unit captain         # una unidad
python3 data/auto_structure_all.py "Space Marines" --detachment gladius-task-force
python3 data/auto_structure_all.py "Space Marines" --no-children          # solo facción padre

# Genera propuestas de loadout estructurado
python3 data/auto_loadout.py "Space Marines"             # toda la facción
python3 data/auto_loadout.py "Space Marines" --unit intercessor-squad  # una unidad

# DEPRECATED: scripts anteriores (usar auto_structure_all.py en su lugar)
# python3 data/auto_structure.py "Space Marines"
# python3 data/auto_structure_enhancements.py "Space Marines"

# Subir datos a Supabase (need supabase: pip install supabase)
# Requiere SUPABASE_URL y SUPABASE_SERVICE_KEY
# Si la facción tiene hijos (e.g. Space Marines), se suben automáticamente
python3 data/seed_supabase.py --faction "Space Marines"            # todo (respeta CONFIRMED)
python3 data/seed_supabase.py --faction "Space Marines" --loadout-only       # solo loadout
python3 data/seed_supabase.py --faction "Space Marines" --detachments-only   # solo detachments
python3 data/seed_supabase.py --faction "Space Marines" --override-confirmed # fuerza sobreescritura
python3 data/seed_supabase.py --faction ALL                        # todas las facciones
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
