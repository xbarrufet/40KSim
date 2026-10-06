# Design

## Context

See proposal.md - Why. Relevant existing state:

- `app/src/data/schema.ts` has no types for an army list yet; the closest existing shapes are `UnitProfile`/`UnitData` (per-unit catalogue data) and `WargearEntry`/`WeaponProfileData` (a unit's wargear catalogue, only present once `unitData` exists for that unit).
- `app/src/data/db.ts` is a thin hand-rolled IndexedDB layer: one `getDB()` singleton with versioned `onupgradeneeded`, and per-store get/put/getAll functions. Existing stores (`factions`, `units`, `baseData`, `unitData`) are keyed by string (`factionSlug` or `factionSlug/unitSlug`); none use auto-incrementing keys or indexes.
- `app/src/home/UploadModal.tsx` + `app/src/data/preprocessBaseData.ts` are the closest existing precedent for "parse an uploaded artifact, match it against the catalogue, store the result" — but that flow matches 1:1 by filename slug, with no partial-match/flagging concept. This change introduces that flagging concept for the first time.
- `app/src/list/ListView.tsx` is currently a disabled placeholder.
- The `units` store currently always writes `category: undefined` (`db.ts` `seedFromCatalog`, `UploadModal.tsx` `putUnit` call) even though the seed/scraped data has real category values (confirmed against `data/space-marines/units.json`, which already matches the `## <category>` headings used in the 40k.app export, e.g. `"Leaders & Characters"`). This change does not fix that gap; see Risks / Trade-offs.
- Per the sample export inspected during exploration, wargear item names in the pasted text match scraped `wargearItem.name` values exactly (just re-ordered/case-shuffled), and chapter factions (e.g. `imperial-fists`) have their own self-contained `units` catalogue — no cross-faction fallback lookup is needed when resolving a parsed list's unit names.

## Goals / Non-Goals

**Goals:**
- Parse the 40k.app text export format specifically (not other list-builder formats).
- Validate unit and weapon **names only** — existence checks, not full per-model loadout/quantity modeling.
- Make partial validity visible and persisted, not a hard pass/fail gate on saving.

**Non-Goals:**
- Validating detachments or enhancements against any catalogue (explicitly deferred; no detachment/enhancement data is even scraped yet outside Space Marines).
- Modeling exact per-model wargear distribution (which model carries which weapon) — only "this name exists somewhere in this unit's wargear catalogue" is checked.
- Validating or storing `Attached to`/`Led by`/`Supported by` as structured leader/bodyguard relationships (even though `BaseData.leads`/`ledBy` already encode this) — stored as free text only in this change.
- Supporting other list-builder export formats (WTC, NewRecruit, BattleScribe).
- Wiring saved lists into the GAME tab's unit picker — out of scope for this change, left for a future one.

## Decisions

**New IndexedDB store `lists`, one record per saved list, keyed by a generated id (not the 40k.app URL).**
Using the URL directly as the IndexedDB key would be simplest, but the export URL is optional (older/manually-typed lists may lack one) and the key would double as both identity and a piece of displayed data. Instead, store id is a generated string (e.g. `crypto.randomUUID()`); the parsed `listUrl` is a regular field, and save logic does a lookup-by-`listUrl` scan before deciding insert-vs-update. This mirrors how `getUnitsByFaction` already does a prefix scan over a store rather than relying on a compound key — consistent with the existing db.ts style.

**Parsing is name/token matching, not a grammar-complete loadout parser.**
Explored alternative: fully model the wargear distribution (how many of each model carry which combo) to validate counts sum to the model count. Rejected for this change — it roughly triples the parsing surface (combo semantics like `+` meaning "equipped together" vs `/` meaning "distributed across" differ per unit and aren't needed for a name-existence check), and the user explicitly scoped validation to "units and weapons exist", not loadout accounting. The wargear line is tokenized by splitting on `/` then `+`, stripping a leading `N×` count, and checking each resulting name — order and counts are not validated. This is a one-way decision for *this change*; loadout modeling can be layered on top of the stored raw wargear text later without re-parsing the list, since the raw text is preserved.

**Unverified is a distinct state from failed, not folded into either pass or fail.**
A unit that matches the catalogue but has no `unitData` yet (common today for every faction except Space Marines) has nothing to validate its weapons against. Treating that as a failure would make most non-Space-Marines lists look broken through no fault of the user's list; treating it as a pass would silently claim a check that didn't happen. Three states (`matched` / `unmatched` / `unverified`) are threaded through both the per-entry unit flag and the per-token wargear flag.

**Store the full list unconditionally; validation flags are metadata, not a gate.**
Matches the existing red/green status-light convention from `faction-unit-browser` (a unit can exist with no BaseData, and still displays). Blocking save on any mismatch would punish exactly the lists most worth saving (ones referencing a unit the user hasn't processed yet, or a weapon name that drifted from the scrape). The paste UI shows the flags after submission so the user can see what didn't resolve, without losing the rest of the list.

**Case-insensitive exact-string matching for both unit names and wargear tokens.**
No fuzzy matching (e.g. Levenshtein distance) in this change. The sample export's names matched scraped names exactly aside from casing; adding fuzzy matching risks silently matching the wrong unit/weapon, which is worse than correctly flagging an unmatched name for the user to fix at the source (the 40k.app list itself, or a future BaseData re-upload).

## Risks / Trade-offs

- [The `units` store's `category` field is currently always written as `undefined`] → Not fixed by this change. The parser reads `## <category>` headings from the pasted text itself (for display grouping on the entry) rather than depending on the `units` store's category field, so this gap doesn't block list upload — but it's worth fixing separately since it affects `faction-unit-browser` too.
- [A unit name appearing more than once in the catalogue under different units — e.g. a generic unit name reused across unrelated chapters] → Out of scope to detect across factions, since matching is scoped to the parsed list's single resolved faction only; a same-faction duplicate name is not expected given 40k.app's own catalogue has no such collisions in the data inspected.
- [40k.app changes its export text format in the future] → No format-version detection in this change; a format change would silently produce more unmatched entries rather than a clear "unsupported format" error. Acceptable for v1 given there's no automated export-format feed to detect against.
- [Dedupe-by-URL silently overwrites a stored list the user may have manually edited after saving] → This change doesn't add any post-save editing of a stored list's entries, so there's nothing to lose today; worth revisiting if manual editing is added later.
