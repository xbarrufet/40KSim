# Spec Delta

## Purpose

Defines the structured loadout data format for unit wargear options, the AI pipeline that proposes structured loadout from raw text rules, and the approve/reject review flow for confirming loadout proposals.

## ADDED Requirements

### Requirement: StructuredLoadoutData Schema

The system SHALL define a `StructuredLoadoutData` record with fields: `tag` (AI_PROPOSED | PENDING | CONFIRMED), and `options` (array of `WargearOption`). Each `WargearOption` SHALL contain: `scope`, `replaces`, `choices`, `isAdditional`, `originalRuleId`, and `originalText`.

#### Scenario: WargearOption scope types
- **WHEN** a wargear rule targets a specific model, all models, any number of models, or a ratio of models
- **THEN** the `scope` field SHALL represent it with `type` being one of `model`, `allModels`, `anyNumber`, or `ratio`, with optional `role` and `ratio` sub-fields

#### Scenario: WargearOption choices with multi-item and locks
- **WHEN** a wargear choice grants multiple items or restricts further replacements
- **THEN** the choice SHALL support an `items` array (each with `count`, `name`, `wargearItemId`), an optional `grants` array, and an optional `locks` array of wargearItemIds

### Requirement: AI Loadout Structuring Script

A Python script `auto_loadout.py` SHALL read each unit's `wargearRules` (text) and `wargear` catalogue (with item IDs) from BaseData, send them to the Claude API, and produce a `loadout_proposals.json` file per faction containing `WargearOption[]` proposals keyed by `faction-slug/unit-slug`.

#### Scenario: Structuring a faction's loadout
- **WHEN** the user runs `python auto_loadout.py "Space Marines"`
- **THEN** the script SHALL process all units in `data/space-marines/BaseData/`, call the Claude API for each unit's wargear rules, and write `data/space-marines/loadout_proposals.json`

#### Scenario: Structuring a single unit's loadout
- **WHEN** the user runs `python auto_loadout.py "Space Marines" --unit captain`
- **THEN** the script SHALL process only `captain.json` and write the result to `data/space-marines/ai-loadout/captain.json`

#### Scenario: AI links wargearItemIds from wargear catalogue
- **WHEN** the AI structures a wargear rule
- **THEN** every `wargearItemId` in the output SHALL reference an actual `wargearItem.id` from the unit's `wargear` array in BaseData

### Requirement: Seed Script Uploads Loadout Proposals

The `seed_supabase.py` script SHALL upload `loadout_proposals.json` data into the `loadout_data` Supabase table with `tag` set to `AI_PROPOSED`.

#### Scenario: Seeding loadout proposals for a faction
- **WHEN** the user runs `python seed_supabase.py "Space Marines"` and `loadout_proposals.json` exists
- **THEN** the script SHALL upsert one `loadout_data` row per unit with `tag: AI_PROPOSED` and `options` from the proposals file

### Requirement: Loadout Review Section in Process Unit Screen

The Process Unit screen SHALL display a "Opciones de Loadout" section showing all wargear options from the unit's `loadout_data` record. Each option SHALL display the original rule text and the structured proposal side by side.

#### Scenario: Loadout section visible when loadout_data exists
- **WHEN** the user opens the Process Unit screen for a unit that has a `loadout_data` record
- **THEN** a "Opciones de Loadout" section SHALL appear showing all proposed wargear options

#### Scenario: Loadout section hidden when no loadout_data exists
- **WHEN** the user opens the Process Unit screen for a unit that has no `loadout_data` record
- **THEN** no "Opciones de Loadout" section SHALL appear

### Requirement: Original Rule Text Visible During Review

Each wargear option in the loadout review section SHALL display the `originalText` field verbatim above the structured proposal, so the user can compare the AI interpretation against the source rule.

#### Scenario: Original text shown for each rule
- **WHEN** the loadout review section renders a wargear option
- **THEN** the original wargear rule text SHALL be displayed as a read-only block above the structured fields (scope, replaces, choices)

#### Scenario: Original text preserved from BaseData
- **WHEN** the AI structuring script produces a WargearOption
- **THEN** the `originalText` field SHALL contain the verbatim `rulesText` from the corresponding `wargearRules` entry, and `originalRuleId` SHALL match its `id`

### Requirement: Approve or Reject Per Rule

The user SHALL be able to approve or reject each wargear option individually. Approving accepts the structured proposal as-is. Rejecting excludes it from the confirmed loadout.

#### Scenario: Approving a rule
- **WHEN** the user clicks "Aprobar" on a wargear option
- **THEN** that option SHALL be marked as approved in the UI and included in the saved loadout

#### Scenario: Rejecting a rule
- **WHEN** the user clicks "Rechazar" on a wargear option
- **THEN** that option SHALL be marked as rejected in the UI and excluded from the saved loadout

#### Scenario: Changing a decision before saving
- **WHEN** the user has approved or rejected a rule but has not yet saved
- **THEN** the user SHALL be able to toggle the decision (approve to reject or vice versa)

### Requirement: Save Loadout Confirmation

Saving the loadout section SHALL write the confirmed options to Supabase with `tag: CONFIRMED`, then update the IndexedDB cache. The save button SHALL be enabled only when every option has been approved or rejected.

#### Scenario: Save with all rules decided
- **WHEN** every wargear option has been approved or rejected and the user clicks "Guardar Loadout"
- **THEN** the system SHALL write the approved options to Supabase `loadout_data` with `tag: CONFIRMED`
- **AND** update the IndexedDB cache with the same data

#### Scenario: Save blocked when undecided rules exist
- **WHEN** at least one wargear option has not been approved or rejected
- **THEN** the "Guardar Loadout" button SHALL be disabled

#### Scenario: Save fails if Supabase write fails
- **WHEN** the Supabase write fails during save
- **THEN** the operation SHALL fail with an error message and IndexedDB SHALL NOT be updated
