# detachment-data-pipeline Specification

## Purpose
Models faction detachments — their rules, enhancements, and stratagems — with AI-assisted structuring of enhancement effects into the existing Effect type system, stored in Supabase with a tag-based review workflow.

## Requirements

### Requirement: Detachment Data Table

The Supabase database SHALL have a `detachment_data` table with columns: `faction_slug` (text), `detachment_slug` (text), `tag` (text), `data` (JSONB), `enhancements` (JSONB, nullable). The primary key SHALL be `(faction_slug, detachment_slug)`.

#### Scenario: Table schema
- **WHEN** the `detachment_data` table is queried
- **THEN** it SHALL contain columns `faction_slug`, `detachment_slug`, `tag`, `data`, and `enhancements` with `(faction_slug, detachment_slug)` as the composite primary key

#### Scenario: Tag values
- **WHEN** a detachment row is stored
- **THEN** the `tag` column SHALL contain one of `SCRAPED`, `AI_PROPOSED`, or `CONFIRMED`

### Requirement: Detachment Raw Data Format

The `data` JSONB column SHALL store the full scraped detachment object including `name`, `slug`, `pointsCost`, `rules` (array of rule objects with `name` and `components`), `enhancements` (array with `name`, `points`, `rules` HTML, `enhancementType`, `limit`, keyword restrictions), `stratagems` (array with `name`, `cpCost`, `turn`, `phases`, `whenRules`, `targetRules`, `effectRules` HTML), and `forceDispositions`.

#### Scenario: Scraped data preserved
- **WHEN** a detachment is scraped from 40k.app and stored
- **THEN** the `data` column SHALL contain the complete detachment object as received from the source

#### Scenario: Detachment rule accessible as text
- **WHEN** the detachment rule is read from the `data` column
- **THEN** the rule name and HTML text content SHALL be accessible from `data.rules[].name` and `data.rules[].components[].textContent`

### Requirement: Structured Enhancement Format

The `enhancements` JSONB column SHALL store an array of structured enhancement objects, each containing: `slug` (string), `name` (string), `points` (number), `enhancementType` (`upgrade` or `miniature`), `limit` (number), `eligibility` (object with `keywords`, `excludedKeywords`, `isEquipableByEpicHero`, `isEquipableByNonCharacterUnit`), `effects` (array of Effect objects reusing the existing Effect union type), `conditionalEffects` (array of `{condition, effects}` for doctrine-conditional rules), and `originalText` (raw HTML).

#### Scenario: Enhancement with simple effects
- **WHEN** an enhancement grants a weapon keyword (e.g. "[Sustained Hits 1]")
- **THEN** its `effects` array SHALL contain a `WeaponKeywordEffect` matching the existing type

#### Scenario: Enhancement with conditional doctrine effects
- **WHEN** an enhancement has an "if the assault doctrine is active" clause with different effects
- **THEN** the base effects SHALL be in `effects` and the doctrine-conditional effects SHALL be in `conditionalEffects` with the doctrine name as `condition`

#### Scenario: Enhancement eligibility
- **WHEN** an enhancement restricts eligibility to specific keywords (e.g. "Gravis model only")
- **THEN** the `eligibility.keywords` array SHALL contain the restricting keywords

### Requirement: Detachment Data Client Functions

The Supabase client module SHALL provide `fetchDetachmentsByFaction(factionSlug)`, `fetchDetachmentData(factionSlug, detachmentSlug)`, `upsertDetachmentData(factionSlug, detachmentSlug, detachmentData)`, and `fetchAllDetachmentDataByFaction(factionSlug)` functions following the same Supabase-first write pattern.

#### Scenario: Fetching all detachments for a faction
- **WHEN** `fetchDetachmentsByFaction` is called with a faction slug
- **THEN** it SHALL return all `detachment_data` rows for that faction

#### Scenario: Upserting detachment data
- **WHEN** `upsertDetachmentData` is called with structured enhancements
- **THEN** it SHALL write to Supabase with `(faction_slug, detachment_slug)` as the conflict key

### Requirement: Scraper Produces Detachment Data for All Factions

The existing `fetch_faction_data.py` script SHALL be runnable with `--all` to scrape detachment data for every faction in `factions.json`, producing a `faction_data.json` file in each faction's data directory.

#### Scenario: Running for all factions
- **WHEN** `fetch_faction_data.py --all` is executed
- **THEN** each faction directory SHALL contain a `faction_data.json` with the faction's detachments

#### Scenario: Running for a single faction
- **WHEN** `fetch_faction_data.py "<faction name>"` is executed
- **THEN** the specified faction's directory SHALL contain an updated `faction_data.json`

### Requirement: AI Enhancement Structuring Script

A Python script (`auto_structure_enhancements.py`) SHALL read enhancement data from `faction_data.json` and produce structured enhancement proposals using the Claude API, following the same pattern as `auto_structure.py`.

#### Scenario: Structuring all enhancements for a faction
- **WHEN** `auto_structure_enhancements.py "<faction name>"` is executed
- **THEN** it SHALL produce structured enhancements for every detachment's enhancements and write the results to the faction's data directory

#### Scenario: Structuring a single detachment's enhancements
- **WHEN** `auto_structure_enhancements.py "<faction name>" --detachment <slug>` is executed
- **THEN** it SHALL produce structured enhancements only for that detachment

#### Scenario: Output format
- **WHEN** the script completes
- **THEN** the output SHALL contain an array of structured enhancement objects per detachment, each with `effects` matching the existing `Effect` union types

### Requirement: Seed Script Detachment Support

The `seed_supabase.py` script SHALL seed the `detachment_data` table from local `faction_data.json` files and AI-structured enhancement proposals.

#### Scenario: Seeding detachments with raw data only
- **WHEN** `seed_supabase.py "<faction>"` is run and no structured enhancements exist
- **THEN** each detachment SHALL be upserted with `tag: "SCRAPED"`, the raw `data` populated, and `enhancements` set to null

#### Scenario: Seeding detachments with structured enhancements
- **WHEN** structured enhancement proposals exist for a faction
- **THEN** each detachment SHALL be upserted with `tag: "AI_PROPOSED"` and the structured `enhancements` populated

#### Scenario: Respecting CONFIRMED tag
- **WHEN** a detachment already has `tag: "CONFIRMED"` in Supabase
- **THEN** the seed script SHALL skip that detachment unless `--override-confirmed` is passed

### Requirement: Detachment Browse View

The app SHALL display a detachments section accessible from the faction detail view, listing all detachments for the selected faction with their name, points cost, and tag status.

#### Scenario: Viewing detachment list
- **WHEN** the user navigates to a faction's detachments
- **THEN** the app SHALL display all detachments with name, points cost, number of enhancements, number of stratagems, and current tag

#### Scenario: Empty state
- **WHEN** a faction has no detachment data in Supabase
- **THEN** the app SHALL display a message indicating no detachment data is available

### Requirement: Detachment Enhancement Review View

The app SHALL provide a detail view for each detachment showing its rule (as formatted HTML text), stratagems (as formatted HTML text), and enhancements with their structured effects editable using the same effect editor components as ProcessUnitView.

#### Scenario: Viewing detachment detail
- **WHEN** the user selects a detachment
- **THEN** the app SHALL display the detachment rule text, stratagems list, and enhancements with their structured effects

#### Scenario: Editing enhancement effects
- **WHEN** the user modifies an enhancement's structured effects
- **THEN** the changes SHALL be saved to Supabase and the tag SHALL update to `CONFIRMED`

#### Scenario: Viewing raw enhancement text
- **WHEN** the user reviews a structured enhancement
- **THEN** the original HTML rules text SHALL be displayed alongside the structured effects for comparison
