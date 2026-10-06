# Design

## Context

See proposal.md - Why. Relevant current state:

- `ArmyList`/`ArmyListEntry` (app/src/data/schema.ts) already hold everything the left column needs: `category`, `unitName`, `points`, `modelCount`, `attachmentText`, `enhancementText`, `rawWargearText`, `wargearTokens` (pre-split into clean names, no `N×` prefix), and `matchedUnitSlug`/`matchedFactionSlug`.
- `app/src/data/preprocessBaseData.ts` already exposes two pure, DB-free functions used today by `ProcessUnitView`: `extractDatasheetContext(baseData)` (per-miniature stats, costs, composition, ledBy/supportedBy) and `preprocessBaseData(baseData)` (full `UnitData` shape: stats, wargear catalogue with parsed ability chips, raw abilities). Neither depends on a stored `UnitData` record existing or being `CONFIRMED`.
- `app/src/home/processUnitLogic.ts`'s `splitWeaponProfiles(wargear)` turns a `WargearEntry[]` into flat ranged/melee rows with grouped ability chips - this is the exact table shape the mockup wants, already built.
- `ProcessUnitView.tsx` renders this same stats/weapon/ability content today, but wrapped in editing controls (structuring forms, resync, save). This change needs the same tables in read-only form.
- The app's visual language is the light "field manual" theme in `App.css` (`--paper`, `--olive`, `--ink`, `--rust`, Barlow Condensed), not the dark mockup reference under `openspec/specs/list-view/screen_design/`. That mockup is used for layout/information-density reference only.
- `GameView.tsx` has no existing spec coverage (confirmed via `openspec list --specs`); removing it needs no delta beyond this proposal's Impact section.

## Goals / Non-Goals

**Goals:**
- One reusable two-column screen component, driven purely by an `ArmyList` plus live `BaseData` lookups, with no new IndexedDB writes.
- Let any matched unit with `BaseData` show a full datasheet immediately, independent of `UnitData`/`CONFIRMED` status.
- Share the stats/weapon-table rendering logic with `ProcessUnitView` rather than duplicating it.

**Non-Goals:**
- Unit-vs-unit or any other combat simulation (explicitly deferred per proposal).
- Any change to how lists are parsed, validated, or matched at import time (`parseArmyList.ts`, the army-list-upload parsing requirements) - this only reads already-stored `ArmyList` records.
- Tracking live game state (command points, battle round, stratagems) - out of scope, not modeled anywhere today.
- Editing a list or a unit's data from this screen - it is read-only.

## Decisions

**Extract a read-only datasheet component instead of duplicating markup.**
`ProcessUnitView` and this new screen both need: a per-miniature stats table, ranged/melee weapon tables with ability chips, and a raw-ability list. Rather than copy that JSX, factor the read-only rendering (currently inline in `ProcessUnitView`'s stats/`WeaponTables`/raw-ability-list sections) into a shared presentational component that takes a `DatasheetContext` + `UnitData`-shaped wargear/abilities and renders them without the surrounding edit controls. `ProcessUnitView` keeps its own editing chrome (structuring forms, resync button, save) wrapped around the same shared tables where practical, or continues rendering its own markup where the editing affordances are tightly coupled to a row (e.g. per-ability "Estructurar/Quitar" buttons) - the extraction only needs to cover what's genuinely identical, not force a single mega-component.
- Alternative considered: leave `ProcessUnitView` untouched and write new, separate table markup for this screen. Rejected - it's the same table shape rendered from the same data, and duplicating it means every future table/column change has to happen twice.

**Read live from BaseData, not from UnitData.**
The right column calls `getBaseData(factionSlug, unitSlug)` then `preprocessBaseData()`/`extractDatasheetContext()` on the fly, exactly as `ProcessUnitView` already does for its read-only sections. `UnitData` (and its `CONFIRMED` tag) is not consulted at all for display - it only matters for the simulation-rule side of things (`abilities[].rule`), which this screen doesn't need.
- Alternative considered: only show a unit once it has `CONFIRMED` UnitData, matching how the rest of the app gates things. Rejected per discussion - that would make most of a real list unviewable today, since confirming every unit's abilities is a manual, per-ability process orthogonal to just wanting to see stats/wargear during a game.

**Match the entry's loadout text against BaseData wargear/profile names at render time.**
`entry.wargearTokens[].name` (already tokenized at import time - split on `/` then `+`, `N×` prefix stripped) is matched case-insensitively against `wargearItem.name` and each `profiles[].name` in the BaseData-derived wargear catalogue. Matching wargear items are kept in full (all their profiles); everything else is dropped from the tables. A token with no match is rendered as plain text next to the tables so a typo or unrecognized item name doesn't silently disappear.
- This re-matches at render time rather than trusting the stored `wargearTokens[].status` (`matched`/`unmatched`/`unverified`), because that status was computed at import time specifically against `unitData.wargear` (per the army-list-upload spec's Weapon Name Validation requirement) and would read `unverified` for any unit without a `CONFIRMED` UnitData record - which, per the previous decision, is now the common case this screen needs to handle well.
- Alternative considered: extend the import-time parser to also match against BaseData and store a richer status. Rejected as out of scope - it would touch the parsing/validation requirements in `army-list-upload`, which this change deliberately leaves alone.

**GAME tab becomes a list picker in front of the same screen.**
`GameView.tsx` is deleted. A small new view renders the saved lists (read via the existing `getAllLists()`) as a simple selectable list - no upload/delete affordances, those stay owned by the LIST tab - and opens the shared two-column screen on selection, with its own back action returning to the picker (not to the LIST tab's table).
- Alternative considered: have the GAME tab literally reuse `ListView`'s table component including its toolbar. Rejected - the add/delete actions belong conceptually to list management (LIST tab), not to the GAME tab's "which list am I playing" picker.

**Keep the existing light theme and component classes.**
New CSS follows `App.css`'s existing conventions (`--paper`/`--olive`/`--ink`/`--rust`, Barlow Condensed for headings, the same border/spacing idioms already used by `.workspace`, `.saved-lists-panel`, `.unit-board-topbar`) and reuses `.datasheet-table`, `.tag-chip`, `.process-unit-section` where the content matches. The dark mockup informs the two-column layout and information density only, not color or type choices.

## Risks / Trade-offs

- **Extracting shared markup touches `ProcessUnitView.tsx`.** [Risk: regression in an existing, working screen] → Mitigation: the extraction is a pure refactor of already-reviewed, already-tested rendering logic (no behavior change intended for Process Unit); verify Process Unit's review flow still works end-to-end after the refactor.
- **Render-time wargear matching can under- or over-match** (e.g. a wargear name that's a substring of another, or a loadout line format the tokenizer doesn't expect). [Risk: wrong weapons shown for a unit] → Mitigation: reuse the same case-insensitive exact-name matching semantics already specified for import-time matching (army-list-upload's Weapon Name Validation), rather than inventing fuzzy matching; unresolved tokens degrade visibly (shown as plain text) rather than silently.
- **Most factions have no BaseData yet** (per CLAUDE.md, only Space Marines has been scraped so far). [Risk: the new screen looks mostly empty/fallback for non-Space-Marines lists] → Mitigation: this is a data-availability gap, not a design flaw in this screen; the No-Datasheet Fallback requirement makes that state legible (clear notice + the entry's own text) rather than broken-looking.
