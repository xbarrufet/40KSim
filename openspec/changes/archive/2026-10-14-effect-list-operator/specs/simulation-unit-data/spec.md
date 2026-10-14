# Spec Delta

## ADDED Requirements

### Requirement: Effects Operator on Structured Abilities
A `StructuredAbility` SHALL support an optional `effectsOperator` field with values `'AND'` | `'OR'`. When absent or `'AND'`, the simulator SHALL apply all effects in the `effects[]` array. When `'OR'`, the effects are mutually exclusive — the simulator SHALL evaluate each effect's conditions (e.g. `unitType`, `targetCondition`) against the target and apply only the matching one, without presenting a choice to the player.

#### Scenario: AND operator — all effects apply (default)
- **WHEN** a structured ability has no `effectsOperator` field and contains two effects
- **THEN** the simulator SHALL apply both effects

#### Scenario: AND operator explicit — same as absent
- **WHEN** a structured ability has `effectsOperator: 'AND'` and contains two effects
- **THEN** the simulator SHALL apply both effects, identical to the absent case

#### Scenario: OR operator — simulator picks by condition
- **WHEN** a structured ability has `effectsOperator: 'OR'` and contains two mortal wounds effects, one with `unitType: "VEHICLE"` and one with `unitType: "ALL"`, and the target has the `VEHICLE` keyword
- **THEN** the simulator SHALL apply only the `VEHICLE` effect and SHALL NOT apply the `ALL` effect

#### Scenario: OR operator — fallback to general
- **WHEN** a structured ability has `effectsOperator: 'OR'` and contains two mortal wounds effects, one with `unitType: "VEHICLE"` and one with `unitType: "ALL"`, and the target does NOT have the `VEHICLE` keyword
- **THEN** the simulator SHALL apply only the `ALL` effect

#### Scenario: Backward compatibility
- **WHEN** existing structured abilities have no `effectsOperator` field
- **THEN** they SHALL behave identically to before (all effects applied)
