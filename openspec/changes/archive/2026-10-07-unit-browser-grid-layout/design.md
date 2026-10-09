# Design

## Context

The faction detail view currently renders units as a single vertical column (`UnitsView.tsx`), with categories as `<h2>` section headers and each unit as an `<li>` in a `<ul>`. Unit rows have `border-bottom` separators, the status dot at the far right, and points displayed as muted text.

The CSS lives in `App.css` under `.unit-columns`, `.unit-category`, `.unit-rows`, `.unit-row`, `.unit-row-points`, and `.status-light`.

## Goals / Non-Goals

**Goals:**
- Four-column balanced unit grid in the faction detail view
- No row separators within the grid
- Status dot adjacent to unit name
- Points as a dark pill badge

**Non-Goals:**
- Changing the faction list view (cards grid stays as-is)
- Changing the upload modal
- Responsive breakpoints for the grid (out of scope for this change)
- Changing the status dot shape or size

## Decisions

### Column distribution algorithm — greedy fill in React, not CSS columns

**Options:**
- A) CSS `column-count: 4` — browser handles layout automatically
- B) JS greedy distribution — compute column assignments in the component

**Decision: B (JS greedy distribution)**

CSS `column-count` breaks inside category groups unpredictably (a category header can end up at the bottom of a column with its units in the next), and it does not allow equal-height balancing when category headers have different visual weight. The JS approach gives exact control:

1. Flatten the ordered list of items: `{ type: 'category', label }` and `{ type: 'unit', ...unit }`, each with weight 1.
2. Compute `target = totalItems / 4`.
3. Walk the flat list, accumulating a running count. When `runningCount >= target * columnIndex + 1`, advance to the next column.
4. Render four `<div>` columns, each containing the items assigned to it.

Category headers that land mid-column render normally — no special treatment needed.

### CSS grid for the four columns

Use `.unit-columns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0 24px; }`. Each column is a `<div>` child of `.unit-columns`.

### Points badge styling

Reuse the existing `.points-tag` style (dark background, mono font, `border-radius: 2px`) already present in `App.css` for the list-detail view. Apply it to `.unit-row-points` instead of the current muted text treatment.

### Status dot reposition

No change to the dot's element or class; only its position in the JSX changes — it moves from after the points span to immediately after the unit name button.

### Separator removal

Remove `border-bottom` from `.unit-row`. Category sections within a column have no extra divider either; vertical space between the category `<h2>` and the first row, plus padding on rows, is sufficient.

## Risks / Trade-offs

- **Uneven column heights for small factions**: A faction with only 4–8 units will produce very short columns. Acceptable — the grid still works visually.
- **Category header at bottom of column**: The greedy algorithm can leave a lone category header at the bottom of a column with no units below it. Mitigation: if the remaining items in the current column is only the category header and the next item is a unit, bump to the next column. This is a minor heuristic; implement only if the plain greedy result looks bad in practice.
- **Hardcoded 4 columns**: No breakpoints for narrow viewports in this change. On mobile, four narrow columns will be unreadable. Accept for now; a responsive follow-up change is the right place to handle it.
