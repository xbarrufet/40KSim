# Spec Delta

## ADDED Requirements

### Requirement: Target Condition on Combat Effects

The effect categories `statModifier`, `diceModifier`, and `weaponKeyword` SHALL support an optional `targetCondition` field that filters effect application based on the defending unit's keywords. When present, the simulator SHALL check the defending unit's keywords before applying the effect. When absent, the effect applies unconditionally (existing behavior).

`TargetCondition` SHALL have two fields:
- `keywords`: a non-empty array of unit keyword strings (e.g. `["VEHICLE"]`, `["MONSTER", "VEHICLE"]`)
- `mode`: `"includes"` (effect applies only when the defender has at least one listed keyword) or `"excludes"` (effect applies only when the defender has none of the listed keywords)

#### Scenario: Lethal Hits non-Vehicle (excludes mode)

- **WHEN** a `weaponKeyword` effect has `targetCondition: { keywords: ["VEHICLE"], mode: "excludes" }` and the defending unit has the `VEHICLE` keyword
- **THEN** the effect is NOT applied to attacks against that unit

#### Scenario: Lethal Hits non-Vehicle against Infantry (excludes mode, no match)

- **WHEN** a `weaponKeyword` effect has `targetCondition: { keywords: ["VEHICLE"], mode: "excludes" }` and the defending unit does NOT have the `VEHICLE` keyword
- **THEN** the effect IS applied to attacks against that unit

#### Scenario: Reroll vs Monster/Vehicle (includes mode)

- **WHEN** a `diceModifier` effect has `targetCondition: { keywords: ["MONSTER", "VEHICLE"], mode: "includes" }` and the defending unit has the `MONSTER` keyword
- **THEN** the effect IS applied to attacks against that unit

#### Scenario: Reroll vs Monster/Vehicle against Infantry (includes mode, no match)

- **WHEN** a `diceModifier` effect has `targetCondition: { keywords: ["MONSTER", "VEHICLE"], mode: "includes" }` and the defending unit has neither `MONSTER` nor `VEHICLE` keyword
- **THEN** the effect is NOT applied to attacks against that unit

#### Scenario: No targetCondition means unconditional

- **WHEN** an effect does not have a `targetCondition` field
- **THEN** the effect applies regardless of the defending unit's keywords (backward compatible)

#### Scenario: Multiple keywords in excludes mode

- **WHEN** a `statModifier` effect has `targetCondition: { keywords: ["MONSTER", "VEHICLE"], mode: "excludes" }` and the defending unit has the `VEHICLE` keyword
- **THEN** the effect is NOT applied (any match in excludes mode blocks the effect)

### Requirement: Target Condition Keyword Vocabulary

The keywords available for `targetCondition` SHALL be: `VEHICLE`, `MONSTER`, `INFANTRY`, `CHARACTER`, `MOUNTED`, `FLY`, `WALKER`, `TITANIC`. These match the `MortalWoundsUnitType` values (excluding `ALL`, which is implicit when no `targetCondition` is set).

#### Scenario: Known keyword used in condition

- **WHEN** the user selects `VEHICLE` as a target condition keyword
- **THEN** it matches units whose keywords include `VEHICLE`

#### Scenario: Vocabulary matches MortalWoundsUnitType

- **WHEN** listing available keywords for targetCondition
- **THEN** they are identical to `MortalWoundsUnitType` values minus `ALL`
