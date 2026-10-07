# Design

## Context

`.datasheet-table th, .datasheet-table td { border-bottom: 1px solid var(--line); }` and `.ability-chip-row td { border-bottom: 1px solid var(--line); }` apply to every table using the `datasheet-table` class — the Models table, and the Ranged/Melee weapon tables alike, per `UnitDatasheet.tsx` (see `proposal.md`). The divider added by `weapon-table-attribution-styling` (`.weapon-owner-divider td { border-top: 2px solid var(--line); }`) is additional to those standing borders, not a replacement, which is why the screenshot in the bug report shows a line after nearly every row instead of only at the ownership boundary.

## Goals / Non-Goals

**Goals:**
- The Ranged/Melee weapon tables show exactly one horizontal line per ownership boundary, and none elsewhere.
- The Models table's existing per-row borders are untouched.

**Non-Goals:**
- Changing the divider's color or thickness — `weapon-table-attribution-styling` already settled on `border-top: 2px solid var(--line)`; this change is only about removing the competing borders around it.

## Decisions

**Add a `weapon-table` class to the Ranged/Melee `<table>` elements (not the Models table), and scope the border removal to it.** `.weapon-table td { border-bottom: none; }` cancels the standard row border for those two tables only; the Models table keeps `.datasheet-table`'s existing border-bottom untouched since it never gets the new class.
- Alternative considered: give the Models table a distinguishing class instead and leave `.datasheet-table` as the "no border" default. Rejected — `.datasheet-table` is also used by `.datasheet-table th` and the general cell padding/font rules shared by all three tables; changing its border default would be the wider blast radius for a change that's only about the two weapon tables.

**Explicitly cancel `.ability-chip-row td`'s own border-bottom within weapon tables, rather than relying on rule order.** `.weapon-table .ability-chip-row td { border-bottom: none; }` has higher specificity than the pre-existing `.ability-chip-row td { border-bottom: 1px solid var(--line); }`, so it reliably wins regardless of each rule's position in the stylesheet.

**Divider rule unchanged in mechanism, just now the only border present.** `.weapon-owner-divider td { border-top: 2px solid var(--line); }` already targets the correct row (the first row of a new owner, per `isNewOwnerGroup` in `UnitDatasheet.tsx`) — no change needed to the divider logic itself, only to what else is drawing lines around it.

## Risks / Trade-offs

- **[Risk]** Removing all other row borders could make it harder to visually parse where one weapon's row ends and the next weapon (same owner) begins, since rows now run together more. → **Mitigation**: each weapon's own stat row and ability-chip row are already visually grouped by the ability chips sitting directly under the stat row with no gap; the existing row padding/line-height provides enough separation without a literal line, matching the user's explicit ask.
