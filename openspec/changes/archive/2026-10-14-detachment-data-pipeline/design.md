# Design

## Context

See proposal.md for motivation. The project already has a working pipeline for unit data: scrape → AI structure → seed Supabase → review in UI → backup. Detachments follow the same pattern. The raw scraper (`fetch_faction_data.py`) already works for Space Marines and produces the full detachment object from 40k.app's RSC payloads. The `Effect` union type in `schema.ts` already covers the effect categories needed for enhancement structuring (stat modifiers, weapon keywords, dice modifiers, damage mitigation, unit keywords, heal).

## Goals / Non-Goals

**Goals:**
- Store detachment data (rules, enhancements, stratagems) in Supabase per faction
- AI-structure enhancement effects into the existing `Effect[]` type system
- Provide a review UI for enhancements following the ProcessUnitView pattern
- Include detachment data in faction backup export/import

**Non-Goals:**
- Structuring detachment rules into effects (stays as text)
- Structuring stratagems into effects (stays as text)
- Modelling the doctrine activation system (conditional effects stored as text tags)
- Connecting enhancements to army list building or simulation engine

## Decisions

### 1. Single `detachment_data` table with JSONB columns

**Choice:** One row per detachment with `data` (raw JSONB) and `enhancements` (structured JSONB).

**Alternatives considered:**
- Separate tables per concern (`detachment_base_data`, `detachment_enhancements_data`, `detachment_stratagems_data`) — follows the unit pattern but adds 3 tables for data that's always accessed together and has fewer records
- Normalized tables with foreign keys for enhancements and stratagems — more complex queries, harder backup/restore, unnecessary given the JSONB pattern works well for `base_data` and `loadout_data`

**Rationale:** Detachments are a self-contained entity (~10-20 per faction). Unlike units which have independent processing stages (base data → abilities → loadout), a detachment's raw data and structured enhancements are always viewed and edited together. One table keeps queries simple and backup/restore trivial.

### 2. Reuse existing `Effect` union type for enhancements

**Choice:** Enhancement effects use the same `Effect` type from `schema.ts` (`StatModifierEffect | DiceModifierEffect | WeaponKeywordEffect | ...`).

**Alternatives considered:**
- New enhancement-specific effect type — would duplicate most of the existing union
- Extending Effect with enhancement-specific variants — unnecessary since all observed enhancement patterns map to existing categories

**Rationale:** Every enhancement rule text inspected maps directly to existing effect categories. The ProcessUnitView effect editor components can be reused without modification.

### 3. Doctrine conditions as text tags

**Choice:** Store doctrine-conditional effects in a `conditionalEffects` array with `condition` as a plain string (e.g. `"assault_doctrine"`).

**Alternatives considered:**
- Enum-typed conditions — premature, doctrine system not yet modelled
- Ignoring conditions — loses information that's important for future simulation

**Rationale:** Captures the full enhancement semantics without requiring the doctrine activation system to exist yet. When the simulation engine models doctrines, these string tags can be matched without migration.

### 4. AI structuring script follows `auto_structure.py` pattern

**Choice:** New `auto_structure_enhancements.py` script using the same Bedrock/API client setup, prompt pattern, and output format.

**Rationale:** Consistent developer experience. Same `CLAUDE_CODE_USE_BEDROCK` / `ANTHROPIC_API_KEY` config, same model selection, same batch processing with per-unit granularity. The prompt will include the existing `Effect` schema definition and a few examples of mapped enhancements.

### 5. Enhancement structuring output stored alongside raw data

**Choice:** The AI script writes to a `enhancement_proposals.json` file in the faction data directory. The seed script reads both `faction_data.json` (raw) and `enhancement_proposals.json` (structured) to compose the `detachment_data` row.

**Alternatives considered:**
- Modifying `faction_data.json` in place — mixes scraped and AI-generated data
- Writing to a per-detachment file — more files to manage for ~10-20 detachments

**Rationale:** Follows the existing pattern where `structuring_proposals.json` sits alongside `units.json` and `BaseData/`. One file per faction keeps the data directory manageable.

### 6. Detachment review UI as a section within faction detail

**Choice:** Add a "Detachments" section/tab within the existing faction detail view, navigating to a DetachmentDetailView for editing.

**Alternatives considered:**
- Separate top-level tab — detachments are per-faction, not cross-faction
- Modal overlay — too cramped for enhancement effect editing

**Rationale:** Detachments are scoped to a faction, so they belong in the faction detail view. The detail view follows the same drill-down pattern as unit → ProcessUnitView.

## Risks / Trade-offs

- **40k.app rate limiting** → The scraper already has retry logic with backoff (`REQUEST_DELAY = 3s`, retry on 429). Running `--all` across ~30+ factions will take time but is a one-time operation.
- **Enhancement rules not fully covered by Effect types** → Some enhancements have complex conditions (e.g. "if embarked within a Transport") that don't map to current effects. These should be stored as `OtherAbility`-style entries with the original text preserved, same as unstructurable unit abilities.
- **Backward compatibility of backup format** → Adding `detachmentData` is additive. Import treats a missing field as empty array. No version bump needed.
