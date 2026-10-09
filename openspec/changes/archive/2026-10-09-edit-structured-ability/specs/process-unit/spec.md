# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
