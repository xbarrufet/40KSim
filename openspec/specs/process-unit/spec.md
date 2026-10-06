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

### Requirement: Fan-Out of Structured Abilities

A single raw ability SHALL be able to expand into multiple structured ability entries when the user structures it, each with an independent `rule`.

#### Scenario: One ability, two effects
- **WHEN** a raw ability describes two independent effects (e.g. a stat increase and a granted keyword) under one trigger condition
- **THEN** the user can add two separate structured ability entries for it, each with its own `rule`, sharing the same trigger text

### Requirement: Confirm Action

Saving the Process Unit screen SHALL set the unit's StructuredAbilitiesData `tag` to `CONFIRMED`.

#### Scenario: First confirmation
- **WHEN** the user saves the Process Unit screen for a unit whose StructuredAbilitiesData is `PENDING`
- **THEN** the StructuredAbilitiesData record's `tag` is set to `CONFIRMED`
- **AND** the reviewed abilities (structured, removed, or OTHER) are persisted as the unit's StructuredAbilitiesData
- **AND** stats and wargear are not persisted — they continue to be read live from BaseData

#### Scenario: Re-confirming an already-confirmed unit
- **WHEN** the user edits and saves the Process Unit screen for a unit whose StructuredAbilitiesData is already `CONFIRMED`
- **THEN** the StructuredAbilitiesData record is updated with the edits and `tag` remains `CONFIRMED`

### Requirement: Manual Re-Sync

The Process Unit screen SHALL allow the user to manually reconcile the ability-review queue against the unit's current BaseData at any time, independent of the upload flow.

#### Scenario: Syncing a points update
- **WHEN** a unit's BaseData has been re-uploaded with an ability that is not already present in the unit's reviewed `abilities` or pending `rawAbilities`, and the user opens the Process Unit screen
- **THEN** the user can trigger a manual re-sync that adds that new ability to the pending `rawAbilities` queue
- **AND** previously structured, removed, or OTHER-marked abilities are not discarded by this action
- **AND** if the re-upload instead changed points, stats, or wargear, the screen already reflects that without any re-sync action, since those are always read live from BaseData

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
