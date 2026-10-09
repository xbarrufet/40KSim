# Tasks

## 1. CSS updates (App.css)

- [x] 1.1 Change `.unit-columns` from a block container to a CSS grid: `display: grid; grid-template-columns: repeat(4, 1fr); gap: 0 24px; align-items: start;` — verify by inspecting the computed style in the browser.
- [x] 1.2 Remove `border-bottom` from `.unit-row` and confirm no horizontal lines appear between unit rows in the faction detail view.
- [x] 1.3 Update `.unit-row-points` to render as a dark pill badge: apply `background: #262e37; color: var(--ink); font-family: var(--mono); font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 2px;` (reusing the existing `.points-tag` pattern) — verify visually that points show as a badge.
- [x] 1.4 Update `.unit-row` flex layout: `display: flex; align-items: center; gap: 8px; padding: 6px 0;` with no explicit ordering — the JSX reorder in task 2.2 controls dot placement.

## 2. Component refactor (UnitsView.tsx)

- [x] 2.1 Implement a `distributeToColumns` helper that accepts an array of items (each typed as `{ type: 'category'; label: string } | { type: 'unit' } & UnitRow`) and returns `[col1Items, col2Items, col3Items, col4Items]` using the greedy algorithm from design.md (target = total / 4, fill left-to-right) — verify by logging the output for Space Marines and confirming four approximately equal-length arrays.
- [x] 2.2 Replace the single `.unit-columns` div contents with four column divs, each rendered from the distributed output of `distributeToColumns`. Each column div renders category `<h2>` or unit `<li>` items in order — verify in the browser that Space Marines units appear in 4 columns.
- [x] 2.3 Reorder JSX within the unit row: unit name button first, status dot immediately after, then a flex spacer, then the points badge — verify status dot appears adjacent to the name.
- [x] 2.4 Update the points value: replace `{unit.points ?? '—'}` with `{unit.points ?? 0}` — verify that a unit with null points shows `0` in the badge.

## 3. Build and lint

- [x] 3.1 Run `npm run build` from `app/` and verify zero TypeScript errors.
- [x] 3.2 Run `npm run lint` from `app/` and verify zero lint errors.

## Workflow follow-up

- Archive the change after implementation is visually confirmed in the running app.
