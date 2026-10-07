# Ability Text Formatting Specification

## Purpose

Renders the small set of inline formatting tags and newline conventions found in BaseData-sourced ability and unit-composition text as actual formatting, instead of literal escaped text, so unit rules are legible wherever they're displayed.

## Requirements

### Requirement: Inline Emphasis Rendering
Text containing `<b>`, `<u>`, or `<i>` tags SHALL render the enclosed content as bold, underlined, or italic respectively, rather than showing the literal tag characters.

#### Scenario: Bold tag
- **WHEN** source text contains `<b>leader</b>`
- **THEN** "leader" is rendered bold, with no literal `<b>` or `</b>` characters visible

#### Scenario: Underline and italic tags
- **WHEN** source text contains `<u>all</u>` or `<i>text</i>`
- **THEN** the enclosed content is rendered underlined or italic respectively, with no literal tag characters visible

### Requirement: Keyword Emphasis Rendering
Text containing a `<k>` tag SHALL render the enclosed content with a distinct keyword-emphasis visual treatment, separate from bold/underline/italic, since `<k>` marks a keyword or ability-reference phrase rather than generic emphasis.

#### Scenario: Keyword tag rendered distinctly
- **WHEN** source text contains `<k>[Lethal Hits:</k> <b>non-</b><k>Vehicle]</k>`
- **THEN** the `<k>`-wrapped segments are rendered with a visual treatment distinguishable from the `<b>`-wrapped segment, with no literal tag characters visible

### Requirement: List Rendering
Text containing `<ul>`/`<li>` tags SHALL render the enclosed items as an actual list, rather than showing the literal tag characters.

#### Scenario: Well-formed list
- **WHEN** source text contains `<ul><li>First item</li><li>Second item</li></ul>`
- **THEN** "First item" and "Second item" are each rendered as a separate list item, with no literal tag characters visible

### Requirement: Paragraph and Line Break Handling
A double newline sequence (`\n\n`) in source text SHALL render as a paragraph break. A single newline (`\n`) or carriage-return (`\r`) sequence SHALL render as a line break within the surrounding content, not as literal characters or a collapsed space.

#### Scenario: Paragraph break
- **WHEN** source text contains `"First paragraph.\n\nSecond paragraph."`
- **THEN** "First paragraph." and "Second paragraph." render as two visually separated paragraphs

#### Scenario: Single line break
- **WHEN** source text contains a single `\n` or `\r` between two sentences
- **THEN** a line break is rendered between them, rather than the sentences running together or the literal escape characters appearing

### Requirement: Graceful Handling of Malformed Tags
When source text contains an unclosed or mismatched tag (e.g. a `<ul>` with no matching `</ul>`, or a `<b>` opened a second time instead of closed), rendering SHALL still display all of the text's content, with the unclosed tag's formatting applied to the remainder of the text rather than the render failing or truncating content.

#### Scenario: Unclosed list tag
- **WHEN** source text contains `<ul><li>One</li><li>Two` with no closing `</li>` or `</ul>`
- **THEN** both "One" and "Two" are still rendered and visible, with no error and no missing content

#### Scenario: Doubled bold tag
- **WHEN** source text contains `<b>Deep Strike<b>.` (a second `<b>` where a `</b>` was expected)
- **THEN** "Deep Strike." is still rendered and visible, with no error and no missing content

### Requirement: Scraping Artifact Removal
A stray bell control character (`\u0007`) occasionally present in source text as a scraping artifact SHALL be removed from rendered output and SHALL NOT appear as a visible character or affect spacing.

#### Scenario: Control character stripped
- **WHEN** source text contains a `\u0007` character immediately before a tag or word boundary
- **THEN** the rendered output contains no visible artifact at that position and the surrounding text reads naturally

### Requirement: No Unsafe HTML Interpretation
Only the known tag vocabulary (`<b>`, `<u>`, `<i>`, `<k>`, `<ul>`, `<li>`) SHALL be interpreted as formatting. Any other tag-like sequence encountered in source text SHALL be rendered as literal visible text rather than being interpreted as HTML markup or injected into the page.

#### Scenario: Unknown tag left literal
- **WHEN** source text contains a tag-like sequence outside the known vocabulary (e.g. `<script>` or `<a href="...">`)
- **THEN** that sequence is rendered as visible literal text, not interpreted as markup, and no HTML is injected into the page
