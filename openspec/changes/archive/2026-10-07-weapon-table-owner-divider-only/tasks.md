# Tasks

## 1. Scope weapon tables and remove competing borders

- [x] 1.1 Add a `weapon-table` class to the Ranged Weapons and Melee Weapons `<table>` elements in `UnitDatasheet.tsx` (alongside the existing `datasheet-table` class), leaving the Models table unchanged, and verify by inspecting rendered markup that only the two weapon tables carry the new class
- [x] 1.2 In `App.css`, add `.weapon-table td { border-bottom: none; }` and `.weapon-table .ability-chip-row td { border-bottom: none; }`, and verify in a real browser that the Models table still shows its per-row borders while the weapon tables show none except the divider
- [x] 1.3 Load a list-view entry with an attached leader/support (e.g. a squad led by a character with its own weapon) and verify only one horizontal line appears in each weapon table — between the squad's last weapon row and the leader's first — with no line between a weapon's stat row and its own ability-chip row, and no line between two different weapons of the same owner
- [x] 1.4 Run `npm run lint`, `npm run build`, and `npm test` from `app/` and verify all pass
