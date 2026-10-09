# Spec Delta

## ADDED Requirements

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
