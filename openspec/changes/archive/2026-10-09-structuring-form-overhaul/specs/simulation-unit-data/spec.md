# Spec Delta

## MODIFIED Requirements

### Requirement: Rule Types

The `effects` array entries SHALL use a `category` field to identify their type. Each effect SHALL also carry an `appliedTo: AppliesTo` field identifying which unit entity the effect targets. `AppliesTo` values: `"SelfModel"`, `"SelfUnit"`, `"Enemy"`, `"Ally"`. Effect categories and their own required fields:

- **`statModifier`** — modifies a characteristic. Fields: `appliedTo`, `weaponTarget` (required only when the selected `stat` is a `WeaponStat`: `"ALL"` | `"RANGE"` | `"MELEE"`), `stat` (`UnitStat` or `WeaponStat`), `mode` (`"add"` | `"subtract"` | `"setValue"` | `"halve"`), and `value` (number, absent for `"halve"`). The `target: "unit" | "weapon"` field is removed; the stat value itself determines whether it is a unit or weapon stat.
- **`diceModifier`** — modifies a dice roll. Fields: `appliedTo`, `roll` (`"toHit"` | `"toWound"` | `"savingThrow"`), `action` (`"rerollOnes"` | `"rerollFailed"` | `"rerollAll"` | `"addToRoll"` | `"subtractFromRoll"` | `"autoSuccess"` | `"ignoreModifiers"`), optional `attackType` (`"RANGE"` | `"MELEE"` | `"ALL"`).
- **`weaponKeyword`** — grants a keyword to weapon profiles. Fields: `appliedTo`, `weaponTarget` (`"ALL"` | `"RANGE"` | `"MELEE"`), `keyword`, optional `value`.
- **`damageMitigation`** — reduces or prevents damage. Fields: `appliedTo`, `kind`, optional `value`, optional `condition`.
- **`mortalWounds`** — deals mortal wounds. Fields: `appliedTo`, plus all existing mortal wounds fields.

The ability-level `appliedTo` field is removed. Each effect carries its own `appliedTo`.

#### Scenario: Effect targeting the unit itself

- **WHEN** an effect modifies the unit's own characteristics or dice rolls
- **THEN** the effect has `appliedTo: "SelfModel"` or `"SelfUnit"` as appropriate

#### Scenario: Effect debuffing an enemy

- **WHEN** an effect reduces an enemy unit's hit rolls
- **THEN** the effect has `appliedTo: "Enemy"`
- **AND** multiple effects in the same `StructuredAbility` may have different `appliedTo` values

#### Scenario: Mixed-target effects in one ability

- **WHEN** a single ability has one effect targeting `SelfUnit` and another targeting `Enemy`
- **THEN** each effect carries its own `appliedTo` field
- **AND** the simulator applies each effect to the correct target independently

## ADDED Requirements

### Requirement: Ability Group Operator

A `StructuredAbility` SHALL support optional `groupId: string` and `groupOperator: 'AND' | 'OR'` fields. Abilities sharing the same `groupId` form a group. When `groupOperator` is `'AND'` (or absent), the simulator evaluates all abilities in the group independently. When `groupOperator` is `'OR'`, the simulator presents them as mutually exclusive choices and applies only the one the player selects.

#### Scenario: OR group — exclusive choice

- **WHEN** two or more abilities share a `groupId` and `groupOperator: "OR"`
- **THEN** the simulator presents them as a labelled choice to the player
- **AND** only the selected ability's effects are applied; the others are skipped

#### Scenario: AND group or no group — independent

- **WHEN** abilities have no `groupId`, or share a `groupId` with `groupOperator: "AND"`
- **THEN** the simulator evaluates each ability independently using its own trigger
- **AND** each ability's effects apply or not based on its own trigger result
