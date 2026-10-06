# Proposal

## Why

`army-list-upload`'s parser (`app/src/data/parseArmyList.ts`) was built and tested against a markdown-decorated sample text (`#`/`##` headings, `**bold**` unit/points lines, `- ` bullets) that turns out not to match what users actually copy from 40k.app. The real "TEXT" export — the one users paste — has no markdown decoration at all: hierarchy is conveyed purely by leading-whitespace depth (0 spaces for category headers, 2 for unit entries, 4 for their Attached-to/Led-by/Supported-by/Enhancement/wargear sub-lines), the title is bare text, the declared-points line has no bold wrapping, and the footer's list URL sits on its own line rather than inside a markdown link. Against the real format, every line-type detector in the parser fails to match, so pasting a real list currently produces an empty or badly broken result. The line *content* syntax inside each line type (`[N pts]`, `(N models)`, the wargear tokenization grammar) was already correct and needs no change — only the structural markers the parser keys off are wrong.

## What Changes

- Rewrite `parseArmyListText`'s line-type detection in `app/src/data/parseArmyList.ts` to key off leading-whitespace depth instead of markdown markers: 0 spaces for top-level lines (title, header, mission, declared points, category headers), 2 spaces for a unit entry's own line, and 4+ spaces for its sub-lines (Attached to/Led by/Supported by/Enhancement/wargear).
- Replace the markdown-decorated `SAMPLE_LIST` test fixture in `app/src/data/parseArmyList.test.ts` with the real, undecorated TEXT export the user confirmed from 40k.app's export panel, and update every assertion that depended on the old (fictional) fixture's shape.
- Correct the `List Parsing` requirement's scenarios in `openspec/specs/army-list-upload/spec.md`, which currently describe the wrong (markdown) structural markers.
- No change to tokenizing, unit-name matching, wargear-token matching, or the parent-faction-fallback logic added in `list-upload-chapter-inheritance` — all of that operates on already-extracted line content, which is unaffected.

## Capabilities

### Modified Capabilities
- `army-list-upload`: the `List Parsing` requirement's scenarios are corrected to describe the real indentation-based structure of 40k.app's TEXT export instead of the previously-assumed markdown-decorated structure.

## Impact

- `app/src/data/parseArmyList.ts`: `parseArmyListText`'s internal line-matching regexes and control flow (the only thing that changes — `tokenizeWargearLine`, `matchUnitNames`, `applyParentFallback`, `matchWargearTokens`, `resolveParentFactionSlug`, `parseAndValidateArmyList`, `saveParsedList` are all unaffected).
- `app/src/data/parseArmyList.test.ts`: fixture and assertions tied to the old markdown-decorated sample.
- `openspec/specs/army-list-upload/spec.md`: `List Parsing` requirement's scenario text.
- No UI changes (`app/src/list/ListView.tsx` already just hands raw pasted text to `parseAndValidateArmyList`, unaware of its internal grammar).
