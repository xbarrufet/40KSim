# Process Unit Specification

## Purpose

Defines the pipeline that turns a unit's BaseData into reviewable, confirmable UnitData for simulation: automatic preprocessing on first upload, per-ability manual review on the Process Unit screen, and the Confirm action that finalizes it.

## Requirements

### Requirement: Automatic Preprocessing on First Upload

When BaseData is uploaded for a unit that has no existing StructuredAbilitiesData, the system SHALL automatically generate a StructuredAbilitiesData proposal tagged `PENDING` and write it to Supabase first, then cache in IndexedDB.

#### Scenario: Auto-generate proposal with Supabase available
- **WHEN** BaseData is uploaded for a new unit and Supabase is reachable
- **THEN** a PENDING StructuredAbilitiesData record SHALL be written to Supabase
- **AND** the same record SHALL be cached in IndexedDB

#### Scenario: Auto-generate proposal with Supabase unavailable
- **WHEN** BaseData is uploaded for a new unit but Supabase is unreachable
- **THEN** the operation SHALL fail with an error message

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

On the Process Unit screen, for every raw ability present in a unit's BaseData — regardless of its BaseData `abilityType` — the user SHALL be able to choose exactly one of: structure it or mark it as `OTHER`. Removing a raw ability without classifying it is not permitted.

#### Scenario: Structuring an ability
- **WHEN** the user structures a raw ability
- **THEN** one or more structured ability entries are added to the StructuredAbilitiesData proposal, each with its own `rule`, per the Fan-Out of Structured Abilities requirement

#### Scenario: Marking an ability as OTHER
- **WHEN** the user marks a raw ability as `OTHER`
- **THEN** the ability's original text is preserved verbatim in the StructuredAbilitiesData for display during simulation
- **AND** it is not translated into a `rule` and has no effect on simulation calculations

#### Scenario: No delete action on raw abilities
- **WHEN** a raw ability is in the unreviewed queue
- **THEN** no action is offered to remove or discard it without classifying it

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

#### Scenario: Type dropdown absent from collapsed reviewed row
- **WHEN** a reviewed ability (structured or OTHER) is displayed in the collapsed listing
- **THEN** no type dropdown (Always / Alone / AsLeader) is shown on the row
- **AND** the type remains editable through the edit form for that ability

#### Scenario: OTHER ability is editable
- **WHEN** a reviewed ability has `category: "OTHER"`
- **THEN** an "Editar" button is shown on the row alongside the existing "Quitar" button

#### Scenario: Editing an OTHER ability — update text
- **WHEN** the user opens the edit form for an OTHER ability
- **THEN** an editable text area pre-filled with the ability's current text is shown
- **AND** a "Guardar como OTHER" button saves the updated text back as an OtherAbility

#### Scenario: Editing an OTHER ability — reclassify as structured
- **WHEN** the user opens the edit form for an OTHER ability and clicks "Estructurar"
- **THEN** the structuring form opens with the ability's text displayed above it
- **AND** committing the structuring form replaces the OtherAbility with the new StructuredAbility at the same list position

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

Saving the Process Unit screen SHALL write the StructuredAbilitiesData to Supabase first (with `tag` set to `CONFIRMED`), then update the IndexedDB cache. The save SHALL fail if the Supabase write fails, regardless of whether the previous tag was `PENDING` or `AI_PROPOSED`.

#### Scenario: Confirm with Supabase available
- **WHEN** the user confirms a unit's structured abilities and Supabase is reachable
- **THEN** the StructuredAbilitiesData SHALL be written to Supabase with `tag: CONFIRMED`
- **AND** the IndexedDB cache SHALL be updated with the same data

#### Scenario: Confirm with Supabase unavailable
- **WHEN** the user confirms a unit's structured abilities but Supabase is unreachable
- **THEN** the save SHALL fail with an error message
- **AND** the IndexedDB cache SHALL NOT be updated

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

The per-ability structuring form SHALL offer a "mortalWounds" (`Heridas Mortales`) effect category. When selected, the form SHALL expose the following fields:

- **Tipo Unidad**: dropdown with values `Todas`, `Vehicle`, `Infantry`, `Monster`, `Character`, `Mounted`, `Fly`, `Walker`, `Titanic`. Default: `Todas`.
- **Impactos** (hits): a selector between two modes:
  - `Notación`: a dice notation text input (e.g. `"1"`, `"D6"`, `"2D3+1"`). Default: `"1"`.
  - `Por Stats`: dropdown of unit stats (`Nº Modelos`, `Movement`, `Toughness`, etc.).
- **Resolución**: strategy selector with two options:
  - `Siempre`: no additional fields.
  - `Tirada`: threshold input (2–6) on 1D6.
- **MW por éxito** (damagePerSuccess): a dice notation text input. Default: `"1"`.

The previous dropdown combos (Fijo/Tirada with sub-selectors for count and dice) are replaced by the dice notation text inputs.

#### Scenario: Default mortal wounds effect

- **WHEN** the user selects the "Heridas Mortales" category for a new effect
- **THEN** the form shows Tipo Unidad=Todas, Impactos=Notación `"1"`, Resolución=Siempre, MW por éxito=`"1"`

#### Scenario: Configuring Haywire Mine damage

- **WHEN** the user configures a mortal wounds effect with rolled damage
- **THEN** the user types `"D3"` in the MW por éxito field instead of selecting Tirada > 1 > D3 from dropdowns

### Requirement: Dice Notation Input Component

The structuring form SHALL provide a reusable text input for dice notation values. The input SHALL accept strings matching the dice notation format (e.g. `"3"`, `"D6"`, `"2D3+1"`). The input SHALL NOT validate on keystroke — validation occurs on save only.

#### Scenario: User types valid notation

- **WHEN** the user types `"2D6"` into a dice notation input
- **THEN** the input accepts the text without error feedback
- **AND** the value is stored as the string `"2D6"`

#### Scenario: User types invalid notation

- **WHEN** the user types `"abc"` into a dice notation input and saves
- **THEN** the save is blocked and the input is highlighted with an error indicator
- **AND** the user can correct the value and retry

### Requirement: Save-Time Validation

The "Guardar" action on the Process Unit screen SHALL validate all dice notation fields in structured abilities before saving. If any field contains an invalid notation string, the save SHALL be blocked and the invalid fields SHALL be visually highlighted.

#### Scenario: All fields valid

- **WHEN** the user clicks "Guardar" and all dice notation fields contain valid notation
- **THEN** the save proceeds normally

#### Scenario: Invalid field blocks save

- **WHEN** the user clicks "Guardar" and one dice notation field contains `"D4"`
- **THEN** the save is blocked
- **AND** the invalid field is highlighted with an error style

### Requirement: Extended Phase Selector

The structuring form's phase selector (labelled "Fase") SHALL offer six values: `Cualquiera`, `Movimiento`, `Disparo`, `Carga`, `Combate`, `Mando`. These map to data model values `ANY`, `MOVEMENT`, `SHOOTING`, `CHARGE`, `FIGHT`, `COMMAND`.

#### Scenario: All phases available in dropdown

- **WHEN** the user opens the phase dropdown in the structuring form
- **THEN** six options are visible: Cualquiera, Movimiento, Disparo, Carga, Combate, Mando

#### Scenario: Default phase is Cualquiera

- **WHEN** a new structuring row is created
- **THEN** the phase selector defaults to Cualquiera (ANY)

### Requirement: Trigger Toggle Switch

The trigger input SHALL be an inline toggle switch instead of a checkbox. When the switch is OFF, the ability applies always (trigger = `"ALWAYS"`, `autoApply` = true) and no text input is shown. When the switch is ON, a text input appears inline for the trigger question. The layout is horizontal: label "Trigger", toggle switch, conditional text input — all on the same line.

#### Scenario: Switch OFF hides text input

- **WHEN** the trigger toggle is OFF
- **THEN** no text input is visible for the trigger field
- **AND** the ability's trigger is set to `"ALWAYS"` with `autoApply: true`

#### Scenario: Switch ON shows text input

- **WHEN** the trigger toggle is switched ON
- **THEN** a text input appears inline to the right of the toggle
- **AND** the user can type a trigger question

#### Scenario: Default state is OFF

- **WHEN** a new structuring row is created with trigger `"ALWAYS"`
- **THEN** the toggle switch defaults to OFF

### Requirement: Compact Form Layout

The structuring form SHALL arrange its top-level fields in a compact row layout:
- **Row 1**: Fase, Frecuencia, Trigger (toggle + text)
- **Row 2**: Target, Categoría
- **Row N**: Category-specific fields

Target and Categoría SHALL always be visible on the same row regardless of the selected category. The "Contexto" dropdown is removed.

#### Scenario: Target and Category on same row

- **WHEN** the structuring form is displayed
- **THEN** the Target dropdown and Categoría dropdown appear on the same horizontal row
- **AND** this row is below the Fase/Frecuencia/Trigger row and above category-specific fields

#### Scenario: No Contexto dropdown

- **WHEN** the structuring form is displayed
- **THEN** no "Contexto" (Always/AsLeader/Alone) dropdown is shown

### Requirement: Heal Effect Category Stub

The structuring form's category dropdown SHALL include a `Curar` (heal) option. When selected, no category-specific fields are shown beyond the Target dropdown. The effect is stored with `category: "heal"` and `appliedTo` only.

#### Scenario: Heal category shows no extra fields

- **WHEN** the user selects "Curar" from the category dropdown
- **THEN** no additional fields appear below the Target/Category row
- **AND** the effect is stored as `{ category: "heal", appliedTo: <selected target> }`

#### Scenario: Heal category in dropdown

- **WHEN** the user opens the category dropdown
- **THEN** "Curar" appears as an option alongside Stats, Tirada, Palabra Clave, Mitigación Daño, and Heridas Mortales

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

### Requirement: Unit Keyword Category in Structuring Form

The per-ability structuring form SHALL offer a "unitKeyword" (`Keyword Unidad`) effect category. When selected, the form SHALL expose:

- **Keyword**: dropdown with known unit keywords: `BENEFIT OF COVER`, `STEALTH`, `SCOUTS`, `DEEP STRIKE`, `LONE OPERATIVE`, `FIGHTS FIRST`.
- **Valor (opc.)**: optional text input for parameterised keywords (e.g. distance for SCOUTS).

#### Scenario: Selecting unit keyword category

- **WHEN** the user selects "Keyword Unidad" from the category dropdown
- **THEN** the form shows a keyword dropdown and an optional value text input

#### Scenario: Default unit keyword effect

- **WHEN** the user selects "Keyword Unidad" for a new effect
- **THEN** the keyword defaults to `BENEFIT OF COVER` and value is empty

#### Scenario: Unit keyword in category dropdown

- **WHEN** the user opens the category dropdown
- **THEN** "Keyword Unidad" appears alongside the existing categories (Stats, Tirada, Palabra Clave, Mitigación Daño, Heridas Mortales, Curar)

### Requirement: Frequency Selector in Structuring Form

The structuring form SHALL include a "Frecuencia" dropdown on the first descriptor row (alongside Contexto, Fase, and Trigger). Values: `Siempre` (default), `1/fase`, `1/ronda`, `1/partida`. These map to data model values `'always'`, `'perPhase'`, `'perRound'`, `'perBattle'`.

#### Scenario: Default frequency is Siempre

- **WHEN** a new structuring row is created
- **THEN** the frequency selector defaults to "Siempre"

#### Scenario: All frequency options available

- **WHEN** the user opens the frequency dropdown
- **THEN** four options are visible: Siempre, 1/fase, 1/ronda, 1/partida

#### Scenario: Frequency shown in ability summary

- **WHEN** a reviewed ability has a non-default frequency (not 'always')
- **THEN** the one-line summary includes the frequency label (e.g. "[1/partida]")

#### Scenario: Frequency preserved on edit

- **WHEN** the user edits a reviewed ability that has `frequency: 'perBattle'`
- **THEN** the frequency dropdown shows "1/partida" pre-selected

### Requirement: Damage Roll in Dice Modifier Form

The dice modifier effect's roll dropdown SHALL include "Daño" and "Hazard" options mapping to `'damage'` and `'hazard'`, alongside the existing "Impactar", "Herir", and "Salvación" options.

#### Scenario: All roll options in dropdown

- **WHEN** the user opens the roll dropdown for a dice modifier effect
- **THEN** five options are visible: Impactar, Herir, Salvación, Daño, Hazard

#### Scenario: Structuring a reroll damage ability

- **WHEN** the user structures "re-roll damage rolls" for ranged attacks
- **THEN** the user selects roll=Daño, action=Reroll todos, arma=Distancia

#### Scenario: Structuring a hazard roll modifier

- **WHEN** the user structures an ability that modifies the hazard (overcharge) roll
- **THEN** the user selects roll=Hazard and the appropriate action
