# Spec Delta

## MODIFIED Requirements

### Requirement: Attack Type Field

Each `StructuredAbility` SHALL include a `phase` field (`"ANY"` | `"MOVEMENT"` | `"SHOOTING"` | `"CHARGE"` | `"FIGHT"` | `"COMMAND"`) indicating which game phase the ability applies to. The simulator uses this field to auto-exclude abilities without asking the player. The field name in the data model changes from `attackType` to `phase`; the values `"SHOOTING"` and `"FIGHT"` retain their existing semantics.

#### Scenario: Melee-only ability skipped during shooting

- **WHEN** the simulator is resolving a shooting attack and evaluates a unit's abilities
- **THEN** abilities with `phase: "FIGHT"` are skipped without presenting their trigger to the player
- **AND** only abilities with `phase: "FIGHT"` or `"ANY"` are evaluated for melee attacks

#### Scenario: Phase-neutral ability always evaluated

- **WHEN** an ability applies regardless of game phase (e.g. a stat bonus that is always active)
- **THEN** `phase` is `"ANY"` and the simulator evaluates it in all phases

#### Scenario: Charge-phase ability evaluated only on charge

- **WHEN** an ability has `phase: "CHARGE"` and the simulator is resolving a shooting attack
- **THEN** the ability is skipped
- **AND** it is only evaluated when the unit completes a charge move

#### Scenario: Movement-phase ability evaluated only on move

- **WHEN** an ability has `phase: "MOVEMENT"`
- **THEN** the simulator evaluates it only during movement resolution
- **AND** it is skipped during shooting, charge, fight, and command phases

#### Scenario: Command-phase ability evaluated only in command

- **WHEN** an ability has `phase: "COMMAND"`
- **THEN** the simulator evaluates it only during command phase resolution
