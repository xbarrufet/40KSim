# Tasks

## 1. Bundle fonts and verify no CDN dependency

- [x] 1.1 Add Chakra Petch and JetBrains Mono as local dependencies (e.g. `@fontsource/chakra-petch`, `@fontsource/jetbrains-mono`) and import them from `app/src/index.css` in place of the current Google Fonts `@import`; verify `grep -r "fonts.googleapis\|fonts.gstatic" app/src` returns nothing
- [x] 1.2 Verify fonts render offline: run `npm run build && npm run preview`, load the app once online, then reload with devtools network set to offline, and confirm Chakra Petch/JetBrains Mono still render (not a fallback font) on the topbar and list-view screen

## 2. Establish the dark tactical theme tokens

- [x] 2.1 Replace the CSS variables in `app/src/index.css`/`app/src/App.css` (`--ink`, `--paper`, `--panel`, `--line`, `--olive`, `--rust`, etc.) with the new dark-tactical palette per `design.md`'s palette decision, and verify every existing variable reference across `App.css` still resolves (no undefined `var(--...)` left pointing at a removed name)
- [x] 2.2 Check label/body text color against its background with a contrast checker and verify a ratio of at least 4.5:1, satisfying the `tactical-ui-theme` spec's "Minimum Contrast for Bright-Room Legibility" requirement
- [x] 2.3 Update `app/index.html`'s `theme-color` meta to match the new panel color and verify it matches the value used for the topbar background

## 3. Restyle shared app chrome for touch

- [x] 3.1 Restyle `.topbar`, `.main-nav button`, `.connection-state`, `.app-footer` in `App.css` with the new palette/typography, and verify each tab-nav button's tappable area is at least 44x44 points by inspecting computed box size in devtools
- [x] 3.2 Replace any chrome `:hover`-only state with a visible resting/selected state plus an `:active` press state, and verify by toggling devtools' touch emulation that the active tab and a pressed button are each visually distinguishable without a mouse hover

## 4. Restyle the list-view roster (ListDetailView)

- [x] 4.1 Restyle `.list-detail-roster`, `.roster-row`, `.roster-row.is-selected`, `.roster-category h2` with the new theme, keeping the selected-row treatment hover-independent, and verify a selected row is visually distinct with touch emulation (no mouse hover) in devtools
- [x] 4.2 Verify every `.roster-row`'s tappable height is at least 44 points via computed box size in devtools
- [x] 4.3 Restyle `.unit-board-topbar`, `.back-link`, `.entry-panel-title` to match, and verify `.back-link`'s tappable area is at least 44x44 points

## 5. Restyle the shared unit datasheet (UnitDatasheet)

- [x] 5.1 Restyle `.datasheet-table` (headers, rows, model/weapon columns) and `.tag-chip`/`.ability-chip-row` in `App.css` with the new monospace stat-table treatment, and verify stat/weapon figure text computes to at least 15px and label/caption text (e.g. `.base-size-tag`, `.profile-meta`) computes to at least 12px in devtools
- [x] 5.2 Load the list-view screen for a saved list with a unit that has both ranged and melee weapons and verify both tables render legibly against the new palette with no leftover light-theme colors (e.g. `#f0f0e4`, `#eae9e0`) visible

## 6. Tune responsive layout for iPad widths

- [x] 6.1 Replace the `.list-detail-grid` breakpoint logic in `App.css` so the two-column layout holds at viewport widths >= 1024px, and verify by resizing devtools viewport to 1024px that roster and datasheet remain side-by-side
- [x] 6.2 Implement the portrait adaptation (744-834px) per `design.md` (narrowed roster column, falling back to single-column collapse only if narrowing proves unreadable), and verify at both 744px and 834px viewport widths that the full roster list and the selected unit's datasheet are each reachable without horizontal scrolling
- [x] 6.3 Verify the pre-existing `@media (max-width: 700px)` rules in `App.css` still make sense under the new breakpoints (adjust or remove per design) and verify no layout regression at a 390px (iPhone-width) viewport, which is already out of this change's device scope but shouldn't visibly break

## 7. Cross-check against the tactical-ui-theme spec

- [x] 7.1 Run `npm run lint` and `npm run build` from `app/` and verify both succeed with no new errors
- [x] 7.2 With the Process Unit screen open (Factions tab, out of scope this change), verify the shared `UnitDatasheet` tables render in the new theme per the design's accepted "visual spillover" trade-off, and that nothing is visually broken (unreadable text, overlapping elements)
- [x] 7.3 Walk each scenario in `openspec/changes/tactical-theme-list-game/specs/tactical-ui-theme/spec.md` against the running app (touch target sizes, hover-independent selection, text size floors, contrast, responsive widths, offline font/icon load) and verify each passes

## Workflow follow-up

- Archive this change once the above tasks are verified and the user has reviewed the new look on an actual iPad (or iPad simulator) in both orientations.
- Revisit the Factions/Home grid, upload modal, and LIST tab's paste/import screens as a follow-up change, per `proposal.md`'s stated out-of-scope list.
