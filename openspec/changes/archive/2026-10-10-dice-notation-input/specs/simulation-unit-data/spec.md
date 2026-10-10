# Spec Delta

## ADDED Requirements

### Requirement: Dice Notation Format

The system SHALL support a dice notation string format for expressing fixed or random values. The format SHALL match the pattern `^(?:[1-9]\d*|(?:[1-6])?D[36](?:\+[1-9]\d*)?)$`. Valid notations: fixed integers (`1`, `10`), single die (`D3`, `D6`), multiple dice (`2D6`, `6D3`), dice with modifier (`D6+2`, `3D3+1`). The system SHALL provide `parseDiceNotation` and `serializeDiceNotation` utility functions to convert between the string format and runtime numeric values for the simulator.

#### Scenario: Parse fixed notation

- **WHEN** the notation string is `"3"`
- **THEN** `parseDiceNotation` returns `{ count: 1, dice: null, modifier: 3 }` representing a fixed value of 3

#### Scenario: Parse single die notation

- **WHEN** the notation string is `"D6"`
- **THEN** `parseDiceNotation` returns `{ count: 1, dice: 'D6', modifier: 0 }`

#### Scenario: Parse multiple dice with modifier

- **WHEN** the notation string is `"2D3+1"`
- **THEN** `parseDiceNotation` returns `{ count: 2, dice: 'D3', modifier: 1 }`

#### Scenario: Serialize fixed value

- **WHEN** serializing `{ count: 1, dice: null, modifier: 5 }`
- **THEN** `serializeDiceNotation` returns `"5"`

#### Scenario: Serialize dice with count

- **WHEN** serializing `{ count: 3, dice: 'D6', modifier: 0 }`
- **THEN** `serializeDiceNotation` returns `"3D6"`

#### Scenario: Invalid notation rejected

- **WHEN** the notation string is `"0"`, `"D4"`, `"7D6"`, or `"abc"`
- **THEN** `parseDiceNotation` returns `null`

## MODIFIED Requirements

### Requirement: Mortal Wounds Hit Strategies

A `mortalWounds` effect's `hits` field SHALL be one of three strategies: `fixed` provides a constant number of impact attempts (value 1–10), `byStat` uses a unit stat value as the number of attempts (stat values: `"models"` plus all `UnitStat` values), `roll` rolls dice to determine the number (count 1–6 of D3 or D6).

The `fixed` and `roll` variants are replaced by a single `notation` variant storing a dice notation string. The `byStat` variant is unchanged. `MortalWoundsHits` becomes:
- `{ kind: 'notation'; value: string }` — a dice notation string (e.g. `"3"`, `"2D6"`, `"D3+1"`)
- `{ kind: 'byStat'; stat: string }` — unchanged

#### Scenario: Fixed hits via notation

- **WHEN** `hits.kind` is `"notation"` and `hits.value` is `"6"`
- **THEN** exactly 6 resolution attempts are made

#### Scenario: Rolled hits via notation

- **WHEN** `hits.kind` is `"notation"` and `hits.value` is `"2D3"`
- **THEN** the simulator rolls 2D3, sums the result, and makes that many resolution attempts

#### Scenario: Hits by stat (model count)

- **WHEN** `hits.kind` is `"byStat"` and `hits.stat` is `"models"`
- **THEN** the number of resolution attempts equals the number of eligible models in the unit

### Requirement: Mortal Wounds Damage Per Success

A `mortalWounds` effect's `damagePerSuccess` field SHALL be a dice notation string. It defaults to `"1"`. The simulator parses it to determine how many mortal wounds each successful resolution attempt deals.

#### Scenario: Fixed damage per success

- **WHEN** `damagePerSuccess` is `"1"`
- **THEN** each successful resolution attempt deals exactly 1 mortal wound

#### Scenario: Rolled damage per success

- **WHEN** `damagePerSuccess` is `"D3"`
- **THEN** each successful resolution attempt rolls 1D3 and deals that many mortal wounds

#### Scenario: Multiple dice damage

- **WHEN** `damagePerSuccess` is `"2D3"`
- **THEN** each successful resolution attempt rolls 2D3, sums them, and deals that many mortal wounds
