# Spec Delta

## MODIFIED Requirements

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
