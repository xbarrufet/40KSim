# Proposal

## Why

`weapon-table-attribution-styling` added a divider line at the boundary between a unit's own weapon rows and an attached leader/support's merged-in rows. In practice, every weapon table row already carries the datasheet table's standard 1px row border (stat row to its own ability-chip row, and from one weapon to the next within the same unit), so the new divider doesn't stand out — the screenshot shows a line after nearly every row, not just at the one boundary that matters. The intent was a single, meaningful separator; the standard row borders need to be removed from the weapon tables so only the ownership-boundary divider remains visible.

## What Changes

- The Ranged Weapons and Melee Weapons tables no longer show a border between a weapon's own stat row and its ability-chip row, nor between two different weapons belonging to the same unit/character.
- The Models table is unaffected — it keeps its existing per-row borders; only the Ranged/Melee weapon tables change.
- The only visible horizontal line in a weapon table remains the one at an ownership boundary: between the last row (stat or ability-chip, whichever is last) of one unit/character's weapons and the first row of the next unit/character's weapons.

## Capabilities

### New Capabilities
_None._

### Modified Capabilities
- `list-view`: the "Weapon Table Model Attribution" requirement's "Divider only at an ownership boundary" scenario (added by `weapon-table-attribution-styling`) is corrected — the divider must be the *only* visible row-separator line in the weapon tables, not an addition on top of the existing per-row borders.

## Impact

- `app/src/App.css` — remove the standard row border for the Ranged/Melee weapon tables specifically (not the Models table), including the `ability-chip-row`'s own border, leaving `.weapon-owner-divider`'s border as the sole visible line
- `app/src/home/UnitDatasheet.tsx` — the Ranged/Melee `<table>` elements need a class distinguishing them from the Models table so the border removal doesn't apply there too
