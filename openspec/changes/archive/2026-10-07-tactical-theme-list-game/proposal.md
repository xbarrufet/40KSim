# Proposal

## Why

The app's current look (light parchment background, olive/rust accents, DM Sans/Barlow Condensed) doesn't match the "tactical/grimdark" 40K aesthetic the user wants, and this is a PWA meant to run on an iPad at the table — several existing interaction patterns (hover-only row states, sub-44pt icon buttons, 8-11px label text) aren't well-suited to touch. A reference mockup (`openspec/specs/list-view/screen_design/`) shows the target look-and-feel: dark panels, monospace stat columns, a sky accent, bordered cards. Reskinning now, starting with the screens that already mirror that mockup's layout, establishes the new visual system before extending it to the rest of the app.

## What Changes

- New dark "tactical" visual theme (palette, typography scale, card/table treatment) replacing the current light parchment theme, applied to:
  - Shared app chrome: topbar, tab nav, connection indicator, footer (`App.tsx`/`App.css`)
  - The List/Game roster + datasheet screens: `ListDetailView` (roster sidebar, selected-row state), `EntryPanel`, and `UnitDatasheet` (stat/weapon tables, tag chips)
- Touch-first interaction model: a 44pt minimum for every tappable element (roster rows, icon buttons), a selected/active visual state that does not depend on `:hover`, and explicit `:active` press feedback for touch.
- Responsive layout rules for the roster+datasheet two-column view tuned to actual iPad landscape/portrait widths, not the current arbitrary 700px breakpoint.
- Fonts and icons stay bundled/self-hosted (no CDN): the mockup's Tailwind CDN + Google Fonts CDN + FontAwesome CDN are translated into the project's existing plain-CSS variable system and `lucide-react` icon set — no new runtime dependency on external hosts, preserving offline-first PWA use.
- Out of scope for this change: restyling the Factions/Home grid's layout, cards, and touch targets, and the upload modal / LIST tab's paste/import screens, are deferred to a follow-up change. **Note:** because the light and dark themes share the same CSS variable names (`--panel`, `--ink`, `--muted`, etc. — see `design.md`), these not-yet-restyled screens will still visually pick up the new dark color values as a side effect; only their layout/density/touch-target work is deferred, not their color.

## Capabilities

### New Capabilities
- `tactical-ui-theme`: Defines the app's dark tactical visual theme and iPad touch-interaction requirements (minimum tap target size, non-hover-dependent selection/active state, responsive two-column layout behavior at iPad widths) as applied to the shared app chrome and the List/Game roster+datasheet screens.

### Modified Capabilities
_None._ `list-view` and `process-unit` already specify selection/highlighting and data-display behavior in implementation-neutral terms (e.g. "highlighting the selected row") — this change satisfies those requirements with a different visual treatment but does not alter what either capability requires.

## Impact

- `app/src/App.css`, `app/src/App.tsx` — new theme variables, fonts, topbar/nav markup for larger touch targets
- `app/src/list/ListDetailView.tsx`, `app/src/list/ListView.tsx` — roster/detail markup and classes
- `app/src/home/UnitDatasheet.tsx` — stat/weapon table and tag-chip styling
- `app/index.html` — `theme-color` meta updated to match the new palette
- New bundled font assets (replacing the current Google Fonts `@import` in `index.css`)
- **Shared-component note**: `UnitDatasheet` is also used by the Process Unit screen (reached from the Factions tab, out of scope this round). Restyling its tables will visually affect that screen too, inside an otherwise still-light-themed page. `design.md` addresses whether that's acceptable spillover or needs containment.
