# Design

## Context

The current theme lives entirely in `app/src/index.css` (base type, Google Fonts `@import`) and `app/src/App.css` (CSS variables + component classes: `.topbar`, `.list-detail-*`, `.roster-row`, `.datasheet-table`, `.tag-chip`, etc.). There's no CSS framework and no component-level styling (no CSS modules, no styled-components) — everything is global class names in two files, per `CLAUDE.md`. `UnitDatasheet.tsx` is a shared, presentation-only component used by both `ListDetailView` (in scope) and `ProcessUnitView` (out of scope, reached from the Factions tab).

The reference mockup (`openspec/specs/list-view/screen_design/code.html`) is a static Tailwind/FontAwesome/Google-Fonts-CDN HTML page, not code meant to be used as-is — it's a visual reference to translate into this project's plain-CSS, `lucide-react`, bundled-fonts stack. See `proposal.md` for the "why" and the capability list.

## Goals / Non-Goals

**Goals:**
- Replace the light-parchment theme with a dark "tactical" theme (palette, fonts, borders, table treatment) for shared chrome + List/Game screens, satisfying `tactical-ui-theme`'s requirements.
- Keep the theme swap mechanical and reversible: new CSS variable values plus new/renamed classes, no new styling architecture.
- Bundle fonts locally; no CDN dependency added.

**Non-Goals:**
- Restyling the Factions grid's layout, cards, or touch targets, and the upload modal / LIST tab's paste/import screens (follow-up change, per proposal). Their colors still change as a side effect of the shared CSS variables (see Decisions below) — only their layout/density/touch-target work is deferred.
- A light/dark theme toggle — this change replaces the theme outright for the in-scope screens, it doesn't add a preference.
- Changing any data/selection/filtering behavior in `ListDetailView`, `UnitDatasheet`, or `process-unit` — only presentation changes.

## Decisions

**Font stack: bundle via `@fontsource` (or self-hosted woff2) instead of the mockup's Google Fonts CDN.** Chakra Petch (display/headings) + JetBrains Mono (all stat/weapon figures and labels, matching the mockup's "tactical readout" feel) + a system sans fallback for body copy, replacing DM Sans/Barlow Condensed. Self-hosting satisfies the "No External Runtime Font or Icon Dependency" requirement and keeps the app installable/usable offline on first load (the current Google Fonts `@import` already has this gap today; this change fixes it rather than carrying it forward).
- Alternative considered: keep Google Fonts CDN like the mockup. Rejected — breaks offline-first PWA use and is explicitly out per the spec.

**Icons: keep `lucide-react`, do not add FontAwesome.** The mockup uses FontAwesome glyphs (shield, crosshairs, chevrons) purely decoratively; `lucide-react` already has equivalents (`Shield`, `Crosshair`, `ChevronRight`, etc.) and is already a bundled dependency.

**Palette: lift brightness relative to the mockup, don't copy its hex values directly.** Mockup panel/bg sit around `#111417`-`#1f2429` with `zinc-400/500` (~`#71717a`/`#a1a1aa`) label text. To hit the new "Minimum Contrast for Bright-Room Legibility" requirement (4.5:1) at those label sizes against a near-black panel, base panel brightness needs to come up (e.g. panel ~`#1a1f24`, labels ~`#9aa5b1`) rather than using the mockup's values as-is. Exact values are tuned during implementation and checked with a contrast calculator against the final panel colors, not pinned here.

**Touch target and selection state: css-only, no new interaction logic.** The mockup's selected-row look (`border-l-4 border-l-sky-400` + distinct background) already doesn't depend on `:hover` for the *selected* state — only the *unselected* row's hover-highlight does. Carry the selected-row treatment as-is; replace `:hover` background changes on unselected rows with an `:active`/touch press state, and pad every tappable row/button to a 44pt minimum (via `min-height`/`padding`, not by growing visible icons).

**Responsive breakpoints: switch from the current single `700px` breakpoint to iPad-width-aware breakpoints.** Keep the two-column grid at `>=1024px` (smallest iPad landscape) unchanged in structure. Below that — resolved during implementation: narrowing the roster column instead of collapsing was evaluated and rejected. At 744-834px (iPad portrait), the datasheet column would be left with roughly 330-410px, too narrow for the 7-column weapon tables (name + RNG/A/BS or WS/S/AP/D) at the new 15px data-figure floor without horizontal scroll — which the spec's "Portrait width remains usable" scenario rules out. The two-column grid instead collapses to a single stacked column below `1024px` (roster above datasheet, full width each), satisfying that scenario directly. The pre-existing phone-oriented rules at `700px` (topbar height, workspace width, footer sizing) are left as their own, separate breakpoint — unaffected by this change, since phones are out of this change's device scope.
- Alternative considered: full list→detail stacked navigation in portrait (roster becomes a full-screen pushable list, as discussed during exploration). Rejected for this change as a bigger structural change than a reskin — revisit in a follow-up if the narrowed two-column portrait layout doesn't hold up in testing.

**Shared `UnitDatasheet` component: restyle its classes directly; accept visual spillover into Process Unit.** Rather than fork the component or add a theme prop, `UnitDatasheet`'s table/chip classes (`.datasheet-table`, `.tag-chip`, etc.) get the new theme styling in place, same as today. The Process Unit screen (still light-themed around it) will show dark tables inside a light page until the Factions-tab follow-up reskins it too.
- Alternative considered: duplicate `UnitDatasheet`'s CSS under a scoped class (e.g. `.themed .datasheet-table`) so Process Unit keeps the old look. Rejected — adds a parallel styling path for a component whose only job is rendering tables, for a visual seam that will resolve itself once the follow-up change lands.

**Shared color variables apply app-wide; not-yet-restyled screens recolor for free.** `--panel`, `--ink`, `--muted`, `--paper`, `--line`, `--olive`, `--rust` are defined once at `:root` (no per-screen scoping, no duplicate variable set) and used by every screen, including the Factions grid, upload modal, and LIST tab's paste/import screens. Flipping their values therefore recolors those screens too, even though their layout/density/touch-target work is still deferred. This was surfaced during implementation (see `proposal.md`'s updated "What Changes" note) and accepted rather than adding a scoped-override mechanism, consistent with this document's "no new styling architecture" goal.
- Alternative considered: scope the new dark values to a wrapper class (e.g. `.tactical`) and leave `:root` on the light values, with Factions-only selectors opting out. Rejected — a second theming mechanism for the sole purpose of keeping one not-yet-restyled tab's colors unchanged a little longer, directly against the "no new styling architecture" goal above.

## Risks / Trade-offs

- **[Risk]** Visual seam on the Process Unit screen (dark tables in a light page) until the Factions-tab follow-up change lands. → **Mitigation**: accepted per the decision above; the follow-up is already anticipated in the proposal's "Out of scope" list.
- **[Risk]** Lifting the mockup's palette brightness to meet the 4.5:1 contrast floor may dilute the "grimdark" look the mockup conveys. → **Mitigation**: contrast floor applies to text/background pairs, not to borders/accents/decorative elements — panels can stay dark; only label and body text brightness is constrained.
- **[Risk]** Stacking (rather than narrowing) the roster column in portrait means the roster and datasheet are no longer simultaneously visible below 1024px, unlike landscape. → **Mitigation**: the spec's portrait scenario only requires both to be "readable and reachable without horizontal scrolling," not simultaneously visible; a full-width stacked roster above a full-width stacked datasheet satisfies that without a scroll-to-see-the-rest compromise on either panel.
