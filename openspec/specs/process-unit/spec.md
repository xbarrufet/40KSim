# Process Unit Specification

## Purpose

Defines the pipeline that turns a unit's BaseData into reviewable, confirmable UnitData for simulation: automatic preprocessing on first upload, per-ability manual review on the Process Unit screen, and the Confirm action that finalizes it.

## Requirements

### Requirement: Automatic Preprocessing on First Upload

When BaseData is uploaded for a unit that has no existing StructuredAbilitiesData, the system SHALL automatically generate a StructuredAbilitiesData proposal tagged `PENDING`, without requiring any user action.

#### Scenario: New unit uploaded
- **WHEN** a BaseData file is uploaded and matches no existing unit, or matches a unit with no StructuredAbilitiesData record
- **THEN** a StructuredAbilitiesData record is created for that unit with `tag: "PENDING"` and its raw abilities copied from BaseData as the review queue
- **AND** the record does not store stats, model profiles, or a wargear catalogue — those are always read live from BaseData

### Requirement: Re-upload Does Not Affect Existing UnitData

Re-uploading BaseData for a unit that already has a StructuredAbilitiesData record (`PENDING` or `CONFIRMED`) SHALL replace only the BaseData record. It SHALL NOT create, overwrite, or regenerate the StructuredAbilitiesData record.

#### Scenario: Re-upload after confirmation
- **WHEN** a BaseData file is uploaded for a unit whose StructuredAbilitiesData has `tag: "CONFIRMED"`
- **THEN** the unit's BaseData record is replaced with the uploaded file
- **AND** the unit's StructuredAbilitiesData record, including its `tag` and all reviewed content, is left unchanged

#### Scenario: Re-upload while still pending
- **WHEN** a BaseData file is uploaded for a unit whose StructuredAbilitiesData has `tag: "PENDING"`
- **THEN** the unit's BaseData record is replaced with the uploaded file
- **AND** the existing `PENDING` StructuredAbilitiesData record is left unchanged — it is not regenerated from the new BaseData

### Requirement: Weapon-Level Ability Parsing

Weapon profile abilities that match the known core/weapon ability vocabulary (e.g. `TORRENT`, `SUSTAINED HITS 1`, `BLAST 2`, `TWIN-LINKED`) SHALL be parsed automatically into a `{name, value}` form on the weapon profile every time a unit's wargear is read from BaseData, without manual review or storage.

#### Scenario: Recognized weapon ability
- **WHEN** a unit's wargear catalogue is read from its current BaseData and a weapon profile ability's name matches the known vocabulary
- **THEN** it appears in that weapon profile's abilities as `{name, value}`, with any numeric qualifier (e.g. `1` in `SUSTAINED HITS 1`) extracted as `value`
- **AND** no manual structuring step or stored copy is required for it to appear

### Requirement: Per-Ability Review Actions

On the Process Unit screen, for every raw ability present in a unit's BaseData — regardless of its BaseData `abilityType` — the user SHALL be able to choose exactly one of: structure it, remove it, or mark it as `OTHER`.

#### Scenario: Structuring an ability
- **WHEN** the user structures a raw ability
- **THEN** one or more structured ability entries are added to the StructuredAbilitiesData proposal, each with its own `rule`, per the Fan-Out of Structured Abilities requirement

#### Scenario: Removing an ability
- **WHEN** the user removes a raw ability
- **THEN** no entry for it appears in the StructuredAbilitiesData's abilities, and it has no effect on simulation

#### Scenario: Marking an ability as OTHER
- **WHEN** the user marks a raw ability as `OTHER`
- **THEN** the ability's original text is preserved verbatim in the StructuredAbilitiesData for display during simulation
- **AND** it is not translated into a `rule` and has no effect on simulation calculations

#### Scenario: originalText set when structuring
- **WHEN** the user structures a raw ability
- **THEN** the first resulting structured ability entry has `originalText` set to the raw ability's BaseData rules text
- **AND** fan-out entries (added via "+ Añadir otra habilidad") do not receive `originalText`

#### Scenario: Original text shown on reviewed row
- **WHEN** a reviewed structured ability has `originalText`
- **THEN** the collapsed reviewed row displays the original BaseData rules text below the structured summary
- **AND** the text is formatted using the same `FormattedAbilityText` component used in the unreviewed section

#### Scenario: Original text shown on reviewed row — editing
- **WHEN** the user opens the edit form for a reviewed structured ability
- **THEN** if `originalText` is present, it is used directly as the displayed text above the form
- **AND** if `originalText` is absent, the existing lookup fallback chain (BaseData map → rawAbilities) applies

#### Scenario: Original text shown when reviewing unreviewed ability
- **WHEN** a raw ability is shown in the unreviewed section
- **THEN** its BaseData rules text is displayed above the structuring form (existing behaviour, unchanged)

#### Scenario: Auto-apply toggle in the structuring form
- **WHEN** the user is filling in the structuring form for an ability
- **THEN** the form shows a checkbox toggle labelled "Aplicar siempre (sin preguntar)" next to the Trigger field
- **AND** when the toggle is checked, the Trigger text input is disabled, indicating the text is informational only and the simulator will not ask
- **AND** when the toggle is unchecked, the Trigger text input is active and the simulator will present it as a question during simulation

#### Scenario: autoApply state preserved through commit
- **WHEN** the user commits a structured ability with the auto-apply toggle checked
- **THEN** the resulting `StructuredAbility` has `autoApply: true` stored in StructuredAbilitiesData
- **AND** the trigger text is stored unchanged alongside it

#### Scenario: Effect Target field first in effect form
- **WHEN** the user is editing an effect within the structuring form
- **THEN** the first field shown is "Target" (`appliedTo`: SelfModel | SelfUnit | Enemy | Ally)
- **AND** the "Target" field defaults to SelfModel for new effects
- **AND** for `statModifier` effects, the legacy "Target" (unit/weapon) selector is absent; `weaponTarget` is shown only when the selected stat is a weapon stat

#### Scenario: Dark theme for the structuring form
- **WHEN** the user opens the structuring form in the Process Unit screen
- **THEN** the form background, effect row backgrounds, borders, and inputs use the application's dark theme CSS variables and are visually consistent with the rest of the screen

### Requirement: Fan-Out of Structured Abilities

A single raw ability SHALL be able to expand into multiple structured ability entries when the user structures it, each with an independent `rule`.

#### Scenario: One ability, two effects
- **WHEN** a raw ability describes two independent effects (e.g. a stat increase and a granted keyword) under one trigger condition
- **THEN** the user can add two separate structured ability entries for it, each with its own `rule`, sharing the same trigger text

### Requirement: Fan-Out AND/OR Operator

When a raw ability is fanned out into multiple structured ability entries, the user SHALL be able to specify whether the entries form an AND group (all apply independently) or an OR group (player picks exactly one).

#### Scenario: Default fan-out is AND

- **WHEN** the user fans out a raw ability into multiple entries without changing the operator
- **THEN** all entries are treated as independent abilities (AND behaviour)
- **AND** no `groupId` or `groupOperator` is stored on the entries

#### Scenario: Setting the operator to OR

- **WHEN** the user switches the fan-out selector to OR
- **THEN** all entries in the fan-out share a common `groupId` and `groupOperator: "OR"`
- **AND** the simulator will present them as a mutually exclusive choice during simulation

#### Scenario: AND/OR selector visible when 2 or more rows exist

- **WHEN** the structuring form has at least two rows
- **THEN** an AND/OR selector is displayed between the rows
- **AND** the selector defaults to AND

#### Scenario: Switching back to AND clears groupId

- **WHEN** the user switches the operator back to AND after it was OR
- **THEN** `groupId` and `groupOperator` are removed from all rows in the form

### Requirement: Confirm Action

Saving the Process Unit screen SHALL set the unit's StructuredAbilitiesData `tag` to `CONFIRMED`, regardless of whether the previous tag was `PENDING` or `AI_PROPOSED`.

#### Scenario: First confirmation from PENDING
- **WHEN** the user saves the Process Unit screen for a unit whose StructuredAbilitiesData is `PENDING`
- **THEN** the StructuredAbilitiesData record's `tag` is set to `CONFIRMED`
- **AND** the reviewed abilities (structured, or OTHER) are persisted

#### Scenario: Confirming AI proposals
- **WHEN** the user saves the Process Unit screen for a unit whose StructuredAbilitiesData has `tag: "AI_PROPOSED"`
- **THEN** the StructuredAbilitiesData record's `tag` is set to `"CONFIRMED"`
- **AND** the reviewed abilities are persisted as the unit's confirmed StructuredAbilitiesData

#### Scenario: Re-confirming an already-confirmed unit
- **WHEN** the user edits and saves the Process Unit screen for a unit whose StructuredAbilitiesData is already `CONFIRMED`
- **THEN** the StructuredAbilitiesData record is updated with the edits and `tag` remains `CONFIRMED`

### Requirement: Manual Re-Sync

The Process Unit screen SHALL offer two manual reconciliation actions against the unit's current BaseData, both available at any time independent of the upload flow. "Re-sincronizar" adds abilities that are in the live BaseData but not yet in the reviewed or pending queues. "Re-sincronizar sin cambios" acknowledges a BaseData update as non-breaking — it updates the sync marker without touching reviewed abilities or the pending queue, for cases where only stats, descriptions, or other non-rule content changed.

#### Scenario: Syncing a points update
- **WHEN** a unit's BaseData has been re-uploaded with an ability not already present in the unit's reviewed `abilities` or pending `rawAbilities`, and the user triggers "Re-sincronizar"
- **THEN** that new ability is added to the pending `rawAbilities` queue
- **AND** previously structured, removed, or OTHER-marked abilities are not discarded

#### Scenario: Re-sync without changes when only stats changed
- **WHEN** a unit's BaseData has been re-uploaded with updated stats or description text but no new abilities, and the user triggers "Re-sincronizar sin cambios"
- **THEN** the unit's sync marker is updated to match the current BaseData
- **AND** `abilities` and `rawAbilities` are left unchanged

### Requirement: Datasheet Context Display

The Process Unit screen SHALL display read-only datasheet context sourced from the unit's BaseData: a stats table with one row per miniature, points costs per composition option, the unit composition text, and the names of units that can lead or support this unit.

#### Scenario: Multi-miniature unit shows one row per miniature
- **WHEN** a unit's BaseData has more than one miniature (e.g. Aggressor Sergeant and Aggressor)
- **THEN** the Models table shows one row per miniature with its own M/T/SV/W/LD/OC values

#### Scenario: Costs and composition shown
- **WHEN** the Process Unit screen is open for a unit
- **THEN** it shows one cost row per BaseData composition option (model count and points)
- **AND** it shows the unit composition text from BaseData

#### Scenario: Led by and Supported by tags
- **WHEN** a unit's BaseData lists units in `ledBy`
- **THEN** the screen shows a "Led by" tag for each `attachType: "leader"` entry and a "Supported by" tag for each `attachType: "support"` entry

#### Scenario: Missing BaseData context degrades gracefully
- **WHEN** a unit's BaseData has no compositions, no ledBy entries, or no composition text
- **THEN** the corresponding section is omitted rather than shown empty or broken

### Requirement: Weapon Profiles Shown As Tables

Wargear weapon profiles SHALL be displayed as separate ranged and melee tables (grouped by `profile.type`), with each profile's parsed weapon-keyword abilities shown as chip badges on that row.

#### Scenario: Ranged and melee split
- **WHEN** the unit's wargear catalogue has both ranged and melee weapon profiles
- **THEN** they are rendered in two separate tables, one per type

#### Scenario: Ability chips on a weapon row
- **WHEN** a weapon profile has one or more parsed abilities (e.g. `TORRENT`, `BLAST` with value `2`)
- **THEN** each is rendered as a small badge on that weapon's row, showing the name and value if present

### Requirement: Mortal Wounds Category in Structuring Form

The per-ability structuring form SHALL offer a "mortalWounds" (`Heridas Mortales`) effect category. When selected, the form SHALL expose all sub-fields needed to fully specify a `MortalWoundsEffect`: `gameEvent`, optional `preRoll`, `targetScope`, optional `range`, `amount` (with strategy-specific sub-fields), and an optional repeatable `amountByKeyword` list.

#### Scenario: Selecting the mortal wounds category
- **WHEN** a user selects "Heridas Mortales" as the effect category in the structuring form
- **THEN** the form shows a `gameEvent` selector with options for `onCharge` and `activeAbility` (v1 only)
- **AND** an optional `preRoll` toggle; when enabled, exposes a `dice` selector (D3 or D6) and a numeric `threshold` field
- **AND** a `targetScope` selector with options `engagedUnit`, `selectedEnemyUnit`, and `allUnitsWithinRange`
- **AND** a numeric `range` field when `targetScope` is not `engagedUnit`
- **AND** an `amount.kind` selector with options `fixed`, `roll`, `perModelRoll`, `multiDiceCount`
- **AND** amount sub-fields rendered according to the chosen kind

#### Scenario: Amount sub-fields for `fixed`
- **WHEN** `amount.kind` is `fixed`
- **THEN** the form shows a numeric `value` field

#### Scenario: Amount sub-fields for `roll`
- **WHEN** `amount.kind` is `roll`
- **THEN** the form shows a `dice` selector (D3 or D6), an optional numeric `count` field (default 1), and an optional numeric `modifier` field (default 0)

#### Scenario: Amount sub-fields for `perModelRoll`
- **WHEN** `amount.kind` is `perModelRoll`
- **THEN** the form shows a numeric `threshold` field (D6 result required to succeed) and a numeric `onSuccess` field (mortal wounds per success)

#### Scenario: Amount sub-fields for `multiDiceCount`
- **WHEN** `amount.kind` is `multiDiceCount`
- **THEN** the form shows a numeric `diceCount` field, a numeric `threshold` field, and a numeric `onSuccess` field

#### Scenario: amountByKeyword overrides
- **WHEN** the user adds an `amountByKeyword` entry
- **THEN** the form shows a text `targetKeyword` field and the same amount sub-form as the base amount
- **AND** the user can add multiple entries, which are ordered most-restrictive-first
- **AND** the user can remove any entry

#### Scenario: Form summary for mortal wounds effect
- **WHEN** a structured ability has a `mortalWounds` effect
- **THEN** the one-line summary displayed in the reviewed abilities list describes the game event, amount strategy, and any keyword overrides in human-readable form

### Requirement: BaseData Change Indicator

The Process Unit screen SHALL display a visible warning at the top when the currently stored BaseData differs from the BaseData that was in use when the unit's structured abilities were last confirmed.

#### Scenario: BaseData updated after confirmation
- **WHEN** a unit's BaseData has been re-uploaded since the last time its structured abilities were confirmed
- **THEN** the Process Unit screen shows a warning indicator at the top of the screen before the user takes any action

#### Scenario: No indicator after confirming with current BaseData
- **WHEN** the user confirms the unit's structured abilities (or uses "Re-sincronizar sin cambios") and the BaseData has not changed since
- **THEN** no warning indicator is shown when the screen is next opened

#### Scenario: No indicator for units that have never been confirmed
- **WHEN** a unit's structured abilities have never been confirmed (tag is `PENDING`) and no BaseData hash is stored
- **THEN** no change warning is shown — the unit is already in an unreviewed state

### Requirement: AI Proposed Tag

A `StructuredAbilitiesData` record SHALL support a `tag` value of `"AI_PROPOSED"` to represent abilities pre-structured by the AI pipeline and awaiting human review. The Process Unit screen SHALL be accessible for `AI_PROPOSED` units in the same way as `PENDING` units.

#### Scenario: AI_PROPOSED unit opens normally
- **WHEN** the user navigates to the Process Unit screen for a unit with `tag: "AI_PROPOSED"`
- **THEN** the screen displays all AI-proposed abilities in the reviewed section (editable)
- **AND** the raw ability queue is empty
- **AND** the user can edit, re-classify, or confirm any of the proposed abilities

#### Scenario: AI_PROPOSED displayed as amber
- **WHEN** a unit's StructuredAbilitiesData has `tag: "AI_PROPOSED"`
- **THEN** its status indicator in the unit list is amber (distinct from red for PENDING and green for CONFIRMED)

### Requirement: AI Proposals Import

The app SHALL allow the user to import a proposals JSON file generated by the AI structuring script. The import SHALL create or overwrite `StructuredAbilitiesData` records for matched units, but only for units whose current tag is absent or `"PENDING"`.

#### Scenario: Importing proposals for a PENDING unit
- **WHEN** the user imports a proposals JSON and the file contains an entry for a unit whose StructuredAbilitiesData is `"PENDING"` or does not exist
- **THEN** the unit's StructuredAbilitiesData is replaced with the AI-proposed data (`tag: "AI_PROPOSED"`, `abilities[]` from the file, `rawAbilities: []`)

#### Scenario: Import does not overwrite CONFIRMED units
- **WHEN** the user imports a proposals JSON and the file contains an entry for a unit whose StructuredAbilitiesData is `"CONFIRMED"`
- **THEN** that unit's StructuredAbilitiesData is left unchanged

#### Scenario: Import does not overwrite AI_PROPOSED units
- **WHEN** the user imports a proposals JSON and the file contains an entry for a unit whose StructuredAbilitiesData is already `"AI_PROPOSED"`
- **THEN** that unit's StructuredAbilitiesData is left unchanged

#### Scenario: Import summary
- **WHEN** the import completes
- **THEN** the app displays a summary showing how many units were imported and how many were skipped

### Requirement: Edit Structured Ability

A reviewed ability with a structured `rule` SHALL be editable after it is added to the reviewed list.

#### Scenario: Editing an existing structured ability
- **WHEN** the user chooses to edit a structured ability in the reviewed list
- **THEN** the structuring form opens pre-filled with that ability's current rule data

#### Scenario: Saving edits replaces the rule
- **WHEN** the user submits the edit form
- **THEN** the structured ability's rule is replaced with the updated values in the reviewed list
- **AND** the ability remains at the same position in the reviewed list

#### Scenario: Cancelling an edit
- **WHEN** the user cancels the edit form
- **THEN** the ability's rule is unchanged
