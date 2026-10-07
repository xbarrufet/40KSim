# Tasks

## 1. Attribution cell color and ownership divider

- [x] 1.1 Give the weapon table's model/owner `<td>` a `weapon-owner-cell` class and style it with the muted color in `App.css`; verified in a real browser that the owner cell (e.g. "Intercessor Squad") renders visually distinct from the weapon name cell next to it
- [x] 1.2 Add an `isNewOwnerGroup` comparison in `UnitDatasheet.tsx` that marks a row's `<tr>` with a `weapon-owner-divider` class when its owner differs from the previous row's, and style `.weapon-owner-divider td` with a thicker top border in `App.css`; verified with a test list (Intercessor Squad led by Ancient) that the divider appears only between the squad's last row and Ancient's first row — not between the squad's own rows, and not in the Ranged Weapons table where every row shared one owner
- [x] 1.3 Run `npm run lint`, `npm run build`, and `npm test` from `app/` and verify all pass (129 tests)

## Workflow follow-up

- Archive this change once reviewed; no further implementation work remains.
