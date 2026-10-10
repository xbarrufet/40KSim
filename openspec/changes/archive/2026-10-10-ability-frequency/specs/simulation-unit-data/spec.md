# Spec Delta

## ADDED Requirements

### Requirement: Ability Frequency

A `StructuredAbility` SHALL support an optional `frequency` field with values `'always'` | `'perPhase'` | `'perRound'` | `'perBattle'`. When absent or `'always'`, the ability has no usage limit and is evaluated every time its trigger and phase conditions are met. Other values indicate the ability can only be activated once per the named scope.

#### Scenario: No frequency field — unlimited use

- **WHEN** a structured ability has no `frequency` field
- **THEN** the simulator evaluates it every time its trigger and phase conditions are met, with no usage tracking

#### Scenario: Frequency always — same as absent

- **WHEN** a structured ability has `frequency: 'always'`
- **THEN** the behavior is identical to an absent `frequency` field

#### Scenario: Once per battle ability

- **WHEN** a structured ability has `frequency: 'perBattle'` and has already been activated once during the game
- **THEN** the simulator SHALL NOT present or evaluate the ability again for the remainder of the game

#### Scenario: Once per phase ability

- **WHEN** a structured ability has `frequency: 'perPhase'` and has been activated in the current phase
- **THEN** the simulator SHALL NOT present or evaluate the ability again until the next occurrence of that phase

#### Scenario: Once per round ability

- **WHEN** a structured ability has `frequency: 'perRound'` and has been activated in the current battle round
- **THEN** the simulator SHALL NOT present or evaluate the ability again until the next battle round
