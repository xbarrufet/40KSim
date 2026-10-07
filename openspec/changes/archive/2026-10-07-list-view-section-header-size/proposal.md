# Proposal

## Why

The list-view screen's section headers ("Models", "Ranged Weapons", "Melee Weapons", "Abilities") render at 13px — the smallest text used for a section-level label on that screen, and too small to read as a clear heading at a glance against the datasheet tables below it.

## What Changes

- The section header text size (`.process-unit-section h2`, shared by Models/Ranged Weapons/Melee Weapons/Abilities on the list-view screen) increases from 13px to 15px.
- Assumption recorded (minor detail, "a bit bigger" was not given an exact size): 15px was chosen to match the primary-data text size already used in the datasheet tables (`.datasheet-table`'s 15px body text), rather than an arbitrary increment — the header is now at least as prominent as the data it introduces.
- This class is shared with the Process Unit screen's own section headers (e.g. "Costs", "Unit Composition", "Abilidades revisadas"), so those get the same size increase as a side effect, consistent with how shared chrome/classes have been handled in prior changes this session.

## Capabilities

### New Capabilities
_None._

### Modified Capabilities
- `list-view`: adds a requirement for section header text size (no existing requirement covers header typography, so this is additive rather than a modification of prior behavior).

## Impact

- `app/src/App.css` — `.process-unit-section h2` font-size: 13px → 15px
