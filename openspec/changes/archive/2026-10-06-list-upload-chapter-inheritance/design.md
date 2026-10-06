# Design

## Context

See proposal.md - Why. Relevant existing state (from `app/src/data/parseArmyList.ts`, built in `add-list-upload`, archived at `openspec/changes/archive/2026-10-06-add-list-upload/`):

- `parseAndValidateArmyList(text)` resolves the parsed list's faction name to a `factionSlug` via `getAllFactions()`, then calls `matchUnitNames(parsed.entries, knownUnits)` where `knownUnits = getUnitsByFaction(factionSlug)` — only ever the pasted list's own faction.
- For each matched entry, wargear tokens are checked against `getUnitData(factionSlug, entry.matchedUnitSlug)` — again hardcoded to the list's own `factionSlug`.
- `FactionRecord` (in `db.ts`) already carries a `category` field, correctly populated from the seed catalogue (confirmed in the prior change's manual testing — this is a different field from the still-broken per-unit `category` on `UnitRecord`, which stays broken and is out of scope here). `app/public/data/units.json` groups chapters under `category: "Space Marines"`, with the generic faction itself (`slug: "space-marines"`) also present in that same category, named exactly `"Space Marines"`.
- Confirmed from the scraped BaseData during the prior change's exploration: a generic unit's datasheet (e.g. `Librarian`) carries `faction.slug: "space-marines"` even though it's usable by every chapter — the scrape treats "Space Marines" as the one canonical owner of generic unit data. Chapter-specific units (e.g. `Tor Garadon`) would be scraped under their own chapter's faction instead. Today only `space-marines` has any `BaseData`/`unitData` uploaded at all.
- `data/factions.json` (the Python-scraped faction list, not the app's bundled seed) confirms the category grouping is `category name == a member faction's own name` only for the `"Space Marines"` category (`"Space Marines"` the faction sits inside category `"Space Marines"` alongside its chapters). The `"Chaos"` category contains `"Chaos Space Marines"` plus several Legions, but no faction is literally named `"Chaos"` — so the parent-resolution rule in this change does not activate for Chaos, by construction, without hardcoding a chapter list.

## Goals / Non-Goals

**Goals:**
- Let pasting a chapter's list (e.g. Imperial Fists) resolve units and their wargear against the generic parent faction's catalogue (`space-marines`) when the chapter's own catalogue/`unitData` has nothing for that unit — without requiring the user to re-upload/re-process anything per chapter.
- Derive "parent faction" from data already present (`category` + faction names), not a hardcoded chapter list, so the rule naturally stays inert for faction groups where no member faction's name equals the category (e.g. Chaos, Imperium, Xenos) rather than guessing at unconfirmed inheritance rules there.

**Non-Goals:**
- Changing the FACTIONS tab, `UploadModal`, status-light computation, or Process Unit screen (confirmed out of scope with the user — this change touches only `army-list-upload`'s matching logic in `parseArmyList.ts`).
- Chaos Legion / Knights-household / any other inheritance beyond what the category-name rule already produces today (effectively Space Marines chapters only, given current data). Confirming or extending inheritance to other faction groups is a game-rules question for the user, not something to infer here (per project convention: never invent 40k rules).
- Multi-level inheritance (a parent having its own parent). Not needed: every faction category in the current data is at most one level deep (one generic faction + its direct members).
- Resolving collisions where a chapter defines a unit with the same name as a generic parent unit but different stats. Not observed in the data, and the user's own framing ("the unit must be unique") treats same-name as same-unit by design.

## Decisions

**Parent resolution reads `category` + faction names, not a static map.**
Alternative considered: hardcode `SPACE_MARINES_CHAPTERS = ['imperial-fists', 'blood-angels', ...] -> 'space-marines'`. Rejected: it would need manual updates as new chapters are added/scraped, and it would silently do nothing differently for Chaos et al. — whereas the data-driven rule (a faction's parent is the other faction in its `category` whose name equals that category) falls out of data that already exists and already generalizes correctly: it activates for Space Marines today, and would activate automatically for any future category shaped the same way, without a code change, while staying inert for categories that aren't shaped that way (Chaos) until someone deliberately renames/restructures that data to match.

**Fallback is one level, tried only when the entry's own faction has no match.**
`matchUnitNames` tries the entry's own faction's units first; only on a miss does the caller try the parent's units. This preserves all existing matching behavior for every faction with no parent (the overwhelming majority) and for every chapter-exclusive unit (e.g. Tor Garadon, who only exists under `imperial-fists` and is tried there first and found immediately — never even reaches the fallback).

**`ArmyListEntry` records which faction a match resolved against.**
Needed because wargear-token matching must read `unitData` from that same faction, not always the entry's own faction. Added as a new field (`matchedFactionSlug: string | null`) alongside the existing `matchedUnitSlug`, rather than inferring it later from `factionSlug === parent-of-list-faction` — storing it directly avoids re-deriving the parent relationship a second time at the wargear-matching step, and keeps that step a pure "look up this faction's unitData" operation regardless of how the unit was found.

**Matching logic changes stay inside `parseArmyList.ts`; no new IndexedDB reads beyond one extra `getUnitsByFaction`/`getUnitData` call pair when a fallback is actually attempted.**
`getAllFactions()` is already fetched once per parse to resolve the list's own faction; the parent's slug is computed from that same already-fetched array (no additional faction fetch). The additional `getUnitsByFaction(parentSlug)` and `getUnitData(parentSlug, slug)` calls only happen for entries that actually miss their own faction and have a parent to fall back to — most lists (any non-chapter faction, or a chapter whose units are all chapter-exclusive) incur zero extra IndexedDB reads.

## Risks / Trade-offs

- [A future faction category is shaped like Space Marines' (member named exactly like the category) but inheritance isn't actually intended lore-wise] → Accepted risk for v1: the rule is a reasonable proxy given how 40k.app itself organizes factions, and no such case exists in the current data. If one appears, it's a one-line data check away from being caught in review, not a silent simulation-correctness bug (this only affects list-upload *matching display*, not any combat math).
- [A chapter and its parent both define units with the same name but different stats] → Not handled; the entry would silently resolve to whichever faction's unit is checked first (chapter's own). Acceptable per the user's explicit framing that a unit name is unique across the hierarchy.
- [`matchedFactionSlug` adds a field to `ArmyList` records already saved by the prior change] → No migration needed: existing stored lists simply have `matchedFactionSlug: undefined` on their entries until re-pasted, and nothing reads that field for anything other than this change's own wargear-matching step (display of previously-saved lists is unaffected either way, since their `wargearTokens` were already computed and stored).
