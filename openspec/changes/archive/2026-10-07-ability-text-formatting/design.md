# Design

## Context

All four render sites (`ListDetailView.tsx:216`, `ProcessUnitView.tsx:269,293`, `UnitDatasheet.tsx:79` — see `proposal.md` Impact) currently interpolate raw BaseData strings directly as JSX text children. No parsing/escaping infrastructure exists anywhere in the app today (confirmed: zero uses of `dangerouslySetInnerHTML`/`innerHTML`, no markdown/sanitizer dependency). The tag vocabulary is small and closed — `<b>`, `<u>`, `<i>`, `<k>`, `<ul>`, `<li>`, never with attributes — but the source data has confirmed malformed cases: ~45 BaseData files have an unclosed `<ul>` (string ends mid-list), and one file (`thunderhawk-gunship.json`) has a `<b>` opened twice instead of closed. Newlines in the source are literal two-character `\n`/`\r` escape sequences (never real newline bytes), with `\n\n` meaning paragraph break and single `\n`/`\r` meaning line break — confirmed via a full-corpus survey of the 69 currently-scraped Space Marines BaseData files.

## Goals / Non-Goals

**Goals:**
- Parse the 6 known tags plus the three newline conventions into real formatting at the four confirmed render sites.
- Never crash or drop content on the known malformed-data cases; never interpret unknown tags as HTML.

**Non-Goals:**
- The separate Markdown (`**bold**`) + bullet-glyph (`■`/`▫`) convention — explicit user decision, left for a future change.
- Wiring up `ruleText` on wargear items — not currently typed or rendered anywhere; out of scope per `proposal.md`.
- A general-purpose HTML sanitizer or markdown engine — the tag vocabulary is small, closed, and fully known; a bespoke parser is simpler and safer than pulling in a library sized for arbitrary HTML.

## Decisions

**Hand-rolled tokenizer, not a library (e.g. `html-react-parser`, `marked`), and not `dangerouslySetInnerHTML`.** The vocabulary is 6 bare tags with no attributes, fully enumerated by the corpus survey. A small regex/state-machine tokenizer that walks the string once, emits a flat list of `{ type: 'text' | 'b' | 'u' | 'i' | 'k' | 'li', children }`-shaped nodes, and renders them to React elements is simpler to reason about and test than configuring a general HTML parser, and it structurally cannot execute or inject arbitrary markup — unknown tags simply fall through as literal text (satisfies "No Unsafe HTML Interpretation").
- Alternative considered: `dangerouslySetInnerHTML` with a sanitizer allowlist (e.g. DOMPurify). Rejected — adds a dependency for a 6-tag vocabulary, and still requires writing the same allowlist logic; a tokenizer that never touches `innerHTML` is strictly safer by construction.

**Malformed-tag handling: close any still-open tag at end-of-string.** When the tokenizer reaches the end of the input with unclosed tags on its stack (the confirmed unclosed-`<ul>` and doubled-`<b>` cases), it treats end-of-string as an implicit close for everything still open, so trailing content is rendered with that formatting rather than discarded. A doubled `<b>` (open where a close was expected) is treated as "close the previous `<b>`, open a new one" — net effect: the text between the two `<b>`s renders bold, text after the second (unclosed) one also renders bold through end-of-string, which matches the "don't drop content" requirement without needing special-case detection of the doubled-tag pattern specifically.

**`\u0007` stripped during a pre-pass, before tokenizing.** It's a context-free scraping artifact (confirmed to carry no formatting meaning), so it's simplest to strip it before the tokenizer sees the string at all, rather than teaching the tokenizer about it.

**Newline handling: split on `\n\n` first for paragraphs, then render remaining single `\n`/`\r` as `<br />` within each paragraph.** This matches the confirmed semantics (double = paragraph, single = line break) without needing to guess intent per occurrence.

**One shared component (e.g. `<FormattedAbilityText text={...} />`), used at all four render sites.** All four sites have the identical problem on the identical data shape (a raw BaseData string); a single component avoids duplicating the tokenizer/renderer and keeps future tag-vocabulary changes (if the scraper's output ever changes) to one place.

**`<k>` styling: a distinct inline visual treatment (e.g. the sky accent color used elsewhere in the dark theme), not reusing bold/italic.** Per the spec's "Keyword Emphasis Rendering" requirement, `<k>` must be visually distinguishable from `<b>`; reusing the existing accent color keeps it consistent with the tactical theme already applied to these screens rather than introducing a new color.

**No dedicated component test for `FormattedAbilityText` — resolved during implementation.** The project's `vitest.config.ts` runs with `environment: 'node'` and only includes `src/**/*.test.ts`; there is no jsdom, no React Testing Library, and no `.tsx` test anywhere in the codebase. Rather than introduce that infrastructure for one component, the user chose to keep the component as a thin, mechanical mapping from the tokenizer's already-thoroughly-tested output to React elements, verified by the manual browser checks already planned in tasks 3.x/4.x instead of an automated DOM assertion.
- Alternative considered: add jsdom + React Testing Library. Rejected by the user as unnecessary new infrastructure for a single component whose logic (the hard part) is already covered by the tokenizer's unit tests.

## Risks / Trade-offs

- **[Risk]** A future BaseData scrape introduces a 7th tag never seen in the current corpus. → **Mitigation**: the spec's "No Unsafe HTML Interpretation" requirement already covers this — an unknown tag renders as literal text rather than breaking, matching today's behavior for that one tag until the vocabulary is deliberately extended.
- **[Risk]** The doubled-`<b>`-closes-at-end-of-string behavior is a judgment call about intent, not a documented 40k.app export rule — a different malformed pattern discovered later might need different handling. → **Mitigation**: scenario coverage in the spec pins today's two confirmed cases; a new malformed pattern would be a new scenario, not a breaking change to this one.
