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
