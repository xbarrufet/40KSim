# Tasks

## 1. Tokenizer

- [x] 1.1 Add a tokenizer module (e.g. `app/src/data/formatAbilityText.ts`) that strips stray `\u0007` characters, then walks the input string once emitting a flat node list distinguishing `text`, `b`, `u`, `i`, `k`, and `li` (inside `ul`) spans, closing any still-open tag at end-of-string; verify with a unit test that `"<b>leader</b>"` tokenizes to a single bold node containing `"leader"`
- [x] 1.2 Handle the two confirmed malformed cases, and verify with unit tests: `"<ul><li>One</li><li>Two"` (unclosed `<ul>`/final `<li>`) tokenizes with both "One" and "Two" present as list items; `"<b>Deep Strike<b>."` (doubled `<b>`) tokenizes with "Deep Strike." present and bold-formatted, no thrown error
- [x] 1.3 Handle paragraph/line-break splitting (`\n\n` → paragraph boundary, single `\n` or `\r` → line break within a paragraph), and verify with a unit test that `"First.\n\nSecond."` produces two paragraph-level groups and `"First.\nSecond."` produces one group with an internal line-break marker
- [x] 1.4 Verify with a unit test that an unknown tag-like sequence (e.g. `"<script>x</script>"`) is treated as literal text in the output nodes, not as a recognized tag type

## 2. Rendering component and styles

- [x] 2.1 Add a `FormattedAbilityText` component that renders the tokenizer's output to React elements (`<strong>`/`<u>`/`<em>` for b/u/i, a keyword `<span>` for k, `<ul>/<li>` for lists, paragraphs/`<br />` for breaks) with no `dangerouslySetInnerHTML`; kept as a thin, mechanical mapping over the already-tested tokenizer output (no DOM-testing infra exists in this project — resolved via user decision to skip adding jsdom/RTL), verified instead by the manual browser checks in tasks 3.x/4.x
- [x] 2.2 Add CSS for the keyword `<span>` (sky accent color, consistent with the existing dark tactical theme) and for rendered `<ul>/<li>` lists in `App.css`, and verify visually that a keyword span and a list render distinctly from surrounding body text

## 3. Wire into the four render sites

- [x] 3.1 Replace the raw text interpolation in `app/src/list/ListDetailView.tsx:216` (`<p>{ability.text}</p>`) with `<FormattedAbilityText text={ability.text} />`, and verify by loading a list-view entry with known tagged ability text that it renders formatted, not literal tags
- [x] 3.2 Replace the two raw text interpolations in `app/src/home/ProcessUnitView.tsx` (lines 269 and 293) with `FormattedAbilityText`, and verify both the OTHER-ability inline text and the pending raw-ability text render formatted on the Process Unit screen
- [x] 3.3 Replace the raw text interpolation in `app/src/home/UnitDatasheet.tsx:79` (`<p className="composition-text">{datasheet.unitComposition}</p>`) with `FormattedAbilityText`, and verify a unit composition containing a `<ul><li>` model-count list renders as an actual list

## 4. Cross-check against the spec

- [x] 4.1 Run the full test suite (`npm test` from `app/`) and verify all tests pass, including the new tokenizer/component tests
- [x] 4.2 Load the Process Unit screen and the list-view screen for a unit whose BaseData is one of the confirmed malformed-tag files (e.g. an ancient/intercessor-squad-family unit for the unclosed `<ul>`, and `thunderhawk-gunship.json` for the doubled `<b>`) and verify the full ability text still renders completely, with no visible error, truncation, or literal tag/escape characters
- [x] 4.3 Walk each scenario in `openspec/changes/ability-text-formatting/specs/ability-text-formatting/spec.md` against the rendered app and verify each passes
