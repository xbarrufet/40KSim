# Spec Delta

## MODIFIED Requirements

### Requirement: Structured Rules

Each structured ability SHALL have a `rule` object encoding its effect for simulation. An ability may instead be left unstructured (see Unstructured (OTHER) Abilities), in which case it SHALL NOT have a `rule`.

#### Scenario: Rule with condition
- **WHEN** an ability has a trigger other than `"ALWAYS"`
- **THEN** `rule.trigger` contains the question the system will ask the player during simulation (e.g. "Is this unit controlling an objective?")

#### Scenario: Always-active rule
- **WHEN** an ability always applies
- **THEN** `rule.trigger` is `"ALWAYS"`

### Requirement: Rule Types

The `rule.type` field SHALL be one of:
- `statsModifier` — changes a profile characteristic value (e.g. objectiveControl +1)
- `diceModifier` — modifies a dice roll result without changing the characteristic (e.g. +1 to save rolls)
- `addAttribute` — grants a normalised weapon/core ability (e.g. LETHAL_HITS)

#### Scenario: StatModifier vs diceModifier
- **WHEN** a rule modifies the save characteristic
- **THEN** use `statsModifier` with `target: "save"`
- **WHEN** a rule modifies the save **roll** (per 10th edition rules, these don't always stack the same)
- **THEN** use `diceModifier` with `target: "save"`

### Requirement: Rule Target (appliesTo)

The `rule.appliedTo` field SHALL default to `"SelfModel"` (this model/unit's own profile). Other values:
- `SelfUnit` — only meaningful when the ability's `type` is `AsLeader`; affects the unit the leader has joined, not the leader's own model
- `Enemy` — affects an enemy unit meeting the trigger condition
- `Ally` — affects an allied unit meeting the trigger condition

Targeting a specific named unit is out of scope for v1.

#### Scenario: SelfModel vs SelfUnit for a leader ability
- **WHEN** an `AsLeader` ability affects only the leader's own characteristics
- **THEN** `rule.appliedTo` is `"SelfModel"`
- **WHEN** an `AsLeader` ability affects the squad the leader has joined
- **THEN** `rule.appliedTo` is `"SelfUnit"`

## ADDED Requirements

### Requirement: Unstructured (OTHER) Abilities

An ability SHALL be representable without a structured `rule`, by setting `category: "OTHER"` and preserving the original ability text in a `text` field. Such abilities SHALL NOT affect simulation calculations.

#### Scenario: Ability kept as display-only text
- **WHEN** an ability has `category: "OTHER"`
- **THEN** it has a `text` field containing the original BaseData ability text
- **AND** it has no `rule` field
- **AND** the simulation engine does not apply any modifier or attribute from it — it is shown to the user for reference only

### Requirement: UnitData Review Tag

A UnitData record SHALL include a `tag` field whose value is `"PENDING"` or `"CONFIRMED"`, indicating whether it has passed manual review on the Process Unit screen.

#### Scenario: Newly generated UnitData
- **WHEN** UnitData is generated automatically from a BaseData upload
- **THEN** its `tag` is `"PENDING"`

#### Scenario: Reviewed and saved UnitData
- **WHEN** a user saves the Process Unit screen for a unit
- **THEN** its `tag` is `"CONFIRMED"`
