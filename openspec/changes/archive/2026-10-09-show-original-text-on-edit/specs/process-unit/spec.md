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

#### Scenario: Original text shown when editing a reviewed ability
- **WHEN** the user opens the edit form for a reviewed structured ability
- **THEN** the original BaseData rules text for that ability is displayed above the structuring form
- **AND** the text lookup resolves via: (1) exact name match in the BaseData abilities map, (2) stripping any fan-out suffix (`(efecto N)`) and retrying the match, (3) falling back to the unit's pending `rawAbilities` list by name
- **AND** if no source yields the text, the text area is omitted rather than shown empty
