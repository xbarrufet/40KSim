# Design

## Context

See proposal.md - Why. The real 40k.app TEXT export, confirmed directly from the user's own paste of the "EXPORT LIST → TEXT" panel for the same "04-10" Imperial Fists list used in `add-list-upload`'s and `list-upload-chapter-inheritance`'s testing:

```
04-10
Imperial Fists · Ceramite Sentinels · Devastator Brethren
Mission: Take and Hold
1990/2000 pts

EPIC HEROES [90 pts]
  Tor Garadon [90 pts] - Warlord
    Attached to Heavy Intercessor Squad
    Artificer Grav-gun + Hand of Defiance

LEADERS & CHARACTERS [165 pts]
  Apothecary Biologis [75 pts]
    Attached to Aggressor Squad
    Enhancement: Master-forged Firearms (+15 pts)
    Absolvor Bolt Pistol + Servo-armature
...
VEHICLES, MONSTERS [500 pts]
  Ballistus Dreadnought [150 pts]
    Storm Bolters + Ballistus Lascannon + Ballistus Missile Launcher + Armoured Feet
...
Exported from 40k.app, view the full list here:
https://www.40k.app/lists/KsM8Gd9KU9
```

Compared to the fictional sample the parser was built against, every line's *content* is identical — `[N pts]`, `(N models)`, the `·`-separated header, `Enhancement: Name (+N pts)`, and the wargear line grammar (`N× Weapon + Weapon / N× Weapon`) all match byte-for-byte. Only the structural decoration differs: no `# `/`## ` headings, no `**bold**`, no `- ` bullets. The one new structural signal is **leading-whitespace depth**: 0 spaces for the title/header/mission/points/category lines, 2 spaces for a unit entry's own line, 4 spaces for its sub-lines. The current implementation's first step (`text.split('\n').map((line) => line.trim())`) discards that signal immediately — this is the root cause, not a missing regex.

## Goals / Non-Goals

**Goals:**
- Make `parseArmyListText` correctly parse the real TEXT export, using indentation depth as the structural signal instead of markdown markers.
- Preserve every other function's behavior and signature exactly (`tokenizeWargearLine`, `matchUnitNames`, `applyParentFallback`, `matchWargearTokens`, `resolveParentFactionSlug`, `parseAndValidateArmyList`, `saveParsedList`) — they all consume already-extracted strings and never see raw indentation.

**Non-Goals:**
- Supporting the markdown-decorated variant this was mistakenly built against. There is no evidence that format is ever actually produced or pasted by a user; carrying dual-format support forward would mean maintaining a parser for a format that may not exist, for no confirmed benefit. If markdown-decorated input is ever confirmed as real, that's a future change.
- Any change to validation (unit/weapon matching) or storage (dedupe, multiple lists) behavior — unaffected by this fix.

## Decisions

**Compute leading-whitespace depth per raw line before trimming, then classify by relative depth rather than hardcoded column counts.**
The real sample uses exactly 2 and 4 spaces, but hardcoding `=== 2` / `=== 4` is one accidental re-export or copy-paste quirk away from breaking again (e.g. a future export using different spacing, or a user's editor collapsing tabs differently). Instead: a line with 0 leading spaces is top-level (title/header/mission/points/category, tried in that fixed order the same way as before); a line with more indentation than 0 but less than the current entry's sub-line depth is a new unit entry (ending the previous entry); a line indented at or beyond that depth is a sub-line of the current entry. Concretely: track `entryIndent` (the indentation of the most recent unit-entry line) and `subLineIndent` (indentation strictly greater than `entryIndent`, learned from the first sub-line seen under that entry, since the model doesn't need to assume an exact depth, only "deeper than the entry line"). This only needs two relative comparisons (`> 0`, `> entryIndent`), not two magic numbers.

**Category vs. unit-entry line shape is otherwise identical (`<name> [<N> pts]`, optionally with trailing text) — depth is the only disambiguator, so order of checks matters.**
Both "EPIC HEROES [90 pts]" and "Ballistus Dreadnought [150 pts]" (a single-model unit, no `(N models)` suffix) match the exact same content pattern. The implementation checks indentation depth first (0 vs. not-0) and only then applies the `<name> [<N> pts]` content pattern — getting this order backwards would make every single-model unit entry look like a category header.

**No feature-detection/fallback to the old markdown markers.**
Considered: keep the old `#`/`##`/`**`/`- ` detection as a fallback when indentation-based detection finds nothing, in case the markdown format is real after all. Rejected per the Non-Goals above — there's no confirmed source for that format, and silently supporting an unconfirmed format risks masking a real parsing failure (e.g. a genuinely malformed paste) behind a code path nobody can actually exercise or test against real data.

**Replace, not supplement, the test fixture.**
`SAMPLE_LIST` in `parseArmyList.test.ts` was never a real export — it was fabricated during `add-list-upload`'s exploration before this gap was discovered. Keeping it around (even as a second fixture) would mean maintaining tests for an input shape no real user will ever produce. It's replaced entirely with the real TEXT export text, keeping the same underlying list content (same units, same faction, same wargear) so the bulk of the existing assertions (unit names, points, model counts, wargear tokens, matching behavior from the prior two changes) carry over with only their expected *parsing route* changing, not their expected *data*.

## Risks / Trade-offs

- [Relative-depth tracking (`entryIndent`/`subLineIndent` learned from the first sub-line) rather than fixed columns] → Slightly more parsing state to carry through the loop than fixed magic numbers, but avoids re-breaking on a minor export formatting tweak; the added state is two integers scoped to the current entry.
- [Dropping markdown-marker support entirely] → If 40k.app's MARKDOWN/MARKDOWN (TABLE) export options are ever actually needed, this change doesn't support them. Acceptable: the user's own export panel shows TEXT as the first/default tab, and nothing in this project has confirmed a real need for the other two.
