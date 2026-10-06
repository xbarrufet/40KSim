# Proposal

## Why

Space Marines chapters (Imperial Fists, Blood Angels, Raven Guard, etc.) each have their own faction catalogue, but most of their units are generic Space Marines units shared across every chapter — confirmed by the scraped data, where a chapter's own `units.json` already lists generic units like "Intercessor Squad" by name, and a generic unit's `BaseData`/`UnitData` is only ever stored once, under the parent `space-marines` faction. Today, `army-list-upload`'s unit and weapon matching only looks at the pasted list's own faction, so pasting an Imperial Fists list always reports every generic unit as unmatched and every weapon as unverified, even when that unit has already been fully processed under `space-marines`. The user should not have to re-upload and re-process the same unit once per chapter just to paste a list for that chapter.

## What Changes

- `army-list-upload`'s unit-name matching falls back to a chapter's parent faction when the chapter's own `units` catalogue has no match for an entry's unit name.
- `army-list-upload`'s weapon-token matching looks up the matched unit's `unitData` under whichever faction (the chapter itself, or its parent) the unit was actually matched against.
- A faction's parent, when it has one, is derived from existing data: the other faction sharing its `category` whose own name equals that category (e.g. category `"Space Marines"` contains a faction literally named `"Space Marines"`, which becomes the parent for every other faction in that category). A faction with no such match has no parent and matching behaves exactly as before.
- No changes to the FACTIONS tab (browsing, uploading BaseData, status lights) or to `faction-unit-browser`/`process-unit` — a unit still only shows green there once BaseData has been uploaded and processed under the specific faction being browsed. This change only affects list-upload matching.

## Capabilities

### Modified Capabilities
- `army-list-upload`: unit-name and weapon-token matching gain a parent-faction fallback, so pasting a chapter's list can resolve units/weapons that were only ever uploaded under the generic parent faction.

## Impact

- `app/src/data/parseArmyList.ts`: unit-name matching (`matchUnitNames`) and the `parseAndValidateArmyList` orchestration gain parent-faction fallback lookups; wargear-token matching uses the faction the unit actually matched under.
- `app/src/data/schema.ts`: `ArmyListEntry` needs to record which faction a match was resolved against (own vs. parent), since wargear lookup depends on it.
- `app/src/data/db.ts`: no store/schema changes; reads `getAllFactions()`/`getUnitsByFaction()`/`getUnitData()` for an additional (parent) faction slug when needed.
- No changes to the Python scraping pipeline, scraped data formats, or any other capability's specs.
