# Spec Delta

## MODIFIED Requirements

### Requirement: Structured Rules

Each structured ability SHALL have an `effects` array encoding its effects for simulation, plus an `attackType` field for automatic phase filtering. An ability may instead be left unstructured (see Unstructured (OTHER) Abilities), in which case it SHALL NOT have an `effects` array.

A structured ability MAY include an `originalText` field containing the verbatim BaseData rules text of the source ability. This field is optional and informational only; the simulator does not use it. Only the first ability produced from a single raw ability carries `originalText`; fan-out entries (named with an `(efecto N)` suffix) do not.

#### Scenario: Rule with free-text trigger

- **WHEN** an ability has a condition that is not always true
- **THEN** the `trigger` field contains a human-readable question the simulator shows the player (e.g. "¿Está esta unidad controlando un objetivo?")
- **AND** the player answers YES/NO; effects apply only on YES

#### Scenario: Always-active ability

- **WHEN** an ability always applies regardless of game state
- **THEN** `trigger` is `"ALWAYS"` and the simulator applies effects without asking

#### Scenario: Phase auto-filter

- **WHEN** an ability has `attackType: "SHOOTING"` and the simulator is resolving a melee attack
- **THEN** the ability's effects are skipped without asking the player
- **AND** only abilities with `attackType: "FIGHT"` or `"ANY"` are evaluated for melee attacks

#### Scenario: Multiple effects under one trigger

- **WHEN** a single ability grants two independent modifiers under the same condition (e.g. +3 Attacks AND Devastating Wounds in the Fight phase)
- **THEN** both effects are entries in the same ability's `effects[]` array
- **AND** a single YES/NO answer to the trigger applies to all effects in that ability

#### Scenario: originalText on structured ability

- **WHEN** a structured ability was produced from a raw BaseData ability
- **THEN** `originalText` contains the raw BaseData `rules` text of that source ability
- **AND** the simulator ignores `originalText`; it is display-only

#### Scenario: originalText absent on fan-out entries

- **WHEN** a single raw ability is expanded into multiple structured abilities (fan-out)
- **THEN** only the first structured ability in the fan-out carries `originalText`
- **AND** additional fan-out entries (whose names end with `(efecto N)`) have no `originalText` field
