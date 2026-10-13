# Tasks

## 1. Add --skip-parent flag to fetch_datasheets.py

- [x] 1.1 Add `--skip-parent` argparse argument to `fetch_datasheets.py`. When provided, build a set of slugs from `data/<parent-slug>/BaseData/*.json` and pass it to `fetch_faction_datasheets`. Skip units whose slug is in that set. Print a summary of skipped vs downloaded. Verify: `python3 data/fetch_datasheets.py "Imperial Fists" --skip-parent space-marines` downloads only 2 unique units.

## 2. Scrape and process subfactions

- [x] 2.1 Run `fetch_datasheets.py` with `--skip-parent space-marines` for all SM subfactions that have unique units. Verify: each subfaction's `BaseData/` contains only unique unit files.
- [x] 2.2 Run `auto_structure.py` and `auto_loadout.py` for each subfaction that has BaseData. Verify: proposals JSON files are generated for unique units only.
- [ ] 2.3 Run `seed_supabase.py` for each subfaction to upload the unique unit data to Supabase. Verify: subfaction data appears in Supabase tables.
