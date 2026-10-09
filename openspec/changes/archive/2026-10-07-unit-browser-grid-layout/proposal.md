# Proposal

## Why

The faction detail unit list is a tall single-column list with row dividers, making it hard to scan large rosters (e.g. Space Marines has 60+ units). A balanced four-column grid with cards and no dividers lets the user take in an entire faction at a glance.

## What Changes

- The unit list in the faction detail view changes from a single vertical column to a **four-column balanced grid**, where category headers and unit rows are distributed greedily across the four columns to produce approximately equal heights.
- **Row dividers removed**: unit rows no longer have a `border-bottom` separator; vertical rhythm is conveyed by padding alone.
- **Status light repositioned**: the red/green status dot moves from the far-right end of each row to immediately after the unit name text.
- **Points badge**: the points value is displayed as a dark pill badge, right-aligned in each row. Shows the numeric value; shows `0` when null.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `look-and-feel`: New requirements covering the faction detail unit grid layout (four-column balanced distribution algorithm), unit row separator removal, status dot placement adjacent to unit name, and points pill badge styling.

## Impact

- `app/src/home/UnitsView.tsx` — layout changes (CSS grid or column distribution logic)
- `app/src/App.css` — `.unit-columns`, `.unit-category`, `.unit-rows`, `.unit-row`, `.status-light` styles
