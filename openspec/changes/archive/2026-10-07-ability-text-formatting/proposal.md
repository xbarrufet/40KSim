# Proposal

## Why

Ability and unit-composition text scraped from 40k.app embeds a small set of inline formatting tags (`<b>`, `<u>`, `<i>`, `<k>`, `<ul>`/`<li>`) and uses literal `\n`/`\n\n`/`\r` sequences for line/paragraph breaks. Today this text is rendered as a plain JSX string, so React escapes it — players see literal `<b>charge move</b>` and run-on prose with no paragraph breaks instead of formatted rules text. This makes ability text harder to read exactly where it matters most: reviewing a unit's rules during list browsing and gameplay.

## What Changes

- A shared renderer parses the known tag vocabulary (`<b>`, `<u>`, `<i>`, `<k>`, `<ul>`/`<li>`) found in BaseData-sourced text into actual formatting (bold/underline/italic/keyword emphasis/lists), and turns `\n\n` into paragraph breaks and single `\n`/`\r` into line breaks within a paragraph.
- The renderer degrades gracefully on the malformed source data already confirmed to exist (an unclosed `<ul>` with no matching `</ul>`; one unclosed `<b>` opened twice instead of closed) — it does not crash or drop the rest of the text, and strips the stray `\u0007` control-character scraping artifact found alongside the malformed `<ul>` cases.
- No raw HTML injection (`dangerouslySetInnerHTML`) is introduced — tags are parsed into a known-safe set of React elements, not interpreted as arbitrary HTML, since the parser must still behave safely if an upload ever contains an unexpected tag.
- Applied at the four confirmed render sites: `ListDetailView.tsx`'s raw ability display, `ProcessUnitView.tsx`'s pending-ability and OTHER-ability display, and `UnitDatasheet.tsx`'s unit composition text.
- Out of scope (per explicit scope decision): the separate Markdown-style (`**bold**`) + bullet-glyph (`■`/`▫`) convention used in auto-generated "this model can be attached to..." text is not touched by this change — it keeps rendering as literal text for now. Also out of scope: wiring up the `ruleText` field found on scraped wargear items — it isn't plumbed through the app's type layer or rendered anywhere today, so there is no existing render site to fix; adding it would be new functionality, not a fix.

## Capabilities

### New Capabilities
- `ability-text-formatting`: Renders the known inline formatting tags and newline conventions found in BaseData-sourced ability and unit-composition text as actual formatting, instead of literal escaped text, with defined fallback behavior for malformed/unclosed tags.

### Modified Capabilities
_None._ `list-view` and `process-unit` already specify that ability/composition text is shown (e.g. "raw ability text" preserved verbatim for display) in content-neutral terms — this change renders the same text with inline formatting applied rather than changing what text is shown or when.

## Impact

- `app/src/list/ListDetailView.tsx:216` — raw ability text display (`<p>{ability.text}</p>`)
- `app/src/home/ProcessUnitView.tsx:269` — OTHER-ability inline text (`<span className="ability-detail">OTHER — {ability.text}</span>`)
- `app/src/home/ProcessUnitView.tsx:293` — pending raw ability text display (`<p>{raw.text}</p>`)
- `app/src/home/UnitDatasheet.tsx:79` — unit composition text (`<p className="composition-text">{datasheet.unitComposition}</p>`)
- New shared parsing/rendering utility under `app/src/data/` (or `app/src/home/`), with unit tests covering the confirmed malformed-tag cases
- `app/src/App.css` — new styling for parsed lists (`<ul>/<li>`) and the `<k>` keyword-emphasis treatment, consistent with the dark tactical theme already applied to these screens
