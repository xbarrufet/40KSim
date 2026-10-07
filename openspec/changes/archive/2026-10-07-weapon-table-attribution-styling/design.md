# Design

## Context

`UnitDatasheet.tsx`'s `WeaponRowGroup` already receives `modelNames` (owner name per `wargearItemId`) when rendering in list-view context, per `list-view`'s existing attribution requirement — see `proposal.md`. `splitWeaponProfiles` preserves the input `wargear` array's order, and `ListDetailView.tsx` concatenates the selected entry's own matched wargear before the attached leader/support's (`[...matched, ...attachedMatch.matched]`), so rows for one owner are always contiguous — never interleaved with another owner's rows.

## Goals / Non-Goals

**Goals:**
- Make the existing attribution column visually distinct from the weapon name.
- Mark the boundary between owners without implying a boundary exists where it doesn't (i.e. never divide same-owner rows).

**Non-Goals:**
- Re-sorting or grouping rows by owner — contiguity is already guaranteed by existing concatenation order, so no new grouping logic is needed.
- Changing the Models/Costs/Abilities tables' styling — scoped to the ranged/melee weapon tables only.

## Decisions

**Detect the boundary by comparing each row to the previous row's owner, not by pre-grouping.** Since rows are already contiguous per owner, a single backward comparison (`modelNames.get(row[i]) !== modelNames.get(row[i-1])`) is sufficient to find every boundary, is O(n), and needs no restructuring of the existing flat `ranged`/`melee` arrays.
- Alternative considered: group rows by owner into nested arrays first, then render each group. Rejected — more restructuring for the same visual result, and would need its own key-stability handling.

**Mark the boundary on the row's own `<tr>` (`border-top`), not the previous row's (`border-bottom`).** Equivalent visually, but keeps the divider's existence tied to "this row starts a new owner" — simpler to reason about when a row also renders a following `ability-chip-row`, which must not carry the divider itself (the divider belongs to the weapon row, not its ability chips).

**Attribution cell gets a new CSS class rather than relying on column position.** `.weapon-owner-cell` makes the color rule explicit and independent of the `.datasheet-table th:not(:first-child), .datasheet-table td:not(:first-child) { text-align: center }` rule that already exists for other columns.

## Risks / Trade-offs

- **[Risk]** If `ListDetailView.tsx`'s wargear concatenation order ever changes to interleave owners (e.g. sorting by weapon name across owners), the divider logic would produce multiple dividers for the same owner instead of one. → **Mitigation**: the spec's scenario pins today's contiguous-owner assumption; interleaving would be a separate, deliberate change that should revisit this requirement.
