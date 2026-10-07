# Proposal

## Why

The list-view screen's weapon tables already attribute each row to the unit or character it belongs to (per `list-view`'s "Weapon Table Model Attribution" requirement), but the attribution column read as plain text with no visual distinction from the weapon name next to it, and nothing marked where one unit's rows ended and an attached leader/support's rows began. This made mixed tables (a squad's own weapons plus a merged-in leader's) harder to scan at a glance.

## What Changes

- The weapon table's model/owner cell (the "Modelo" column) renders in a muted color, distinct from the weapon name cell next to it.
- A horizontal divider line is drawn between consecutive weapon-table rows only where the owning model/character changes — e.g. if rows 1-2 belong to the squad and row 3 belongs to an attached leader, the divider appears only between rows 2 and 3, not between rows 1 and 2.
- This retroactively documents and specifies a change already implemented and verified in the running app (see Impact) — this proposal captures it as a durable requirement rather than planning new work.

## Capabilities

### New Capabilities
_None._

### Modified Capabilities
- `list-view`: the existing "Weapon Table Model Attribution" requirement gains two scenarios specifying the visual treatment (distinct color for the attribution cell, and a divider only at ownership-group boundaries) alongside its existing data-level scenarios.

## Impact

- `app/src/home/UnitDatasheet.tsx` — `WeaponRowGroup`'s model/owner `<td>` now carries a `weapon-owner-cell` class; a new `isNewOwnerGroup` helper compares each row's owner to the previous row's and marks the `<tr>` with a `weapon-owner-divider` class when they differ
- `app/src/App.css` — `.weapon-owner-cell` (muted color) and `.weapon-owner-divider td` (thicker top border) rules
- Already verified: `npm run lint`/`build`/`test` (129 tests) pass; a real-browser check with a squad + attached leader (Intercessor Squad led by Ancient) confirmed the divider appears only between the squad's last row and the leader's first row, and the owner-cell color is visually distinct from the weapon name
