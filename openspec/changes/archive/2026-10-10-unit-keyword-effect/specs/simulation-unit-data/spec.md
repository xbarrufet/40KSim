# Spec Delta

## MODIFIED Requirements

### Requirement: Rule Types

The `effects` array entries SHALL use a `category` field to identify their type. Each effect SHALL also carry an `appliedTo: AppliesTo` field identifying which unit entity the effect targets. `AppliesTo` values: `"SelfModel"`, `"SelfUnit"`, `"Enemy"`, `"Ally"`. Effect categories and their own required fields:

- **`statModifier`** — modifies a characteristic. Fields: `appliedTo`, `weaponTarget` (required only when the selected `stat` is a `WeaponStat`: `"ALL"` | `"RANGE"` | `"MELEE"`), `stat` (`UnitStat` or `WeaponStat`), `mode` (`"add"` | `"subtract"` | `"setValue"` | `"halve"`), and `value` (number, absent for `"halve"`). The `target: "unit" | "weapon"` field is removed; the stat value itself determines whether it is a unit or weapon stat.
- **`diceModifier`** — modifies a dice roll. Fields: `appliedTo`, `roll` (`"toHit"` | `"toWound"` | `"savingThrow"`), `action` (`"rerollOnes"` | `"rerollFailed"` | `"rerollAll"` | `"addToRoll"` | `"subtractFromRoll"` | `"autoSuccess"` | `"ignoreModifiers"`), optional `attackType` (`"RANGE"` | `"MELEE"` | `"ALL"`).
- **`weaponKeyword`** — grants a keyword to weapon profiles. Fields: `appliedTo`, `weaponTarget` (`"ALL"` | `"RANGE"` | `"MELEE"`), `keyword` (from the project's known ability vocabulary, e.g. `IGNORES COVER`, `LETHAL HITS`, `DEVASTATING WOUNDS`), optional `value`.
- **`unitKeyword`** — grants a keyword to a unit. Fields: `appliedTo`, `keyword` (from a known unit keyword vocabulary: `BENEFIT OF COVER`, `STEALTH`, `SCOUTS`, `DEEP STRIKE`, `LONE OPERATIVE`, `FIGHTS FIRST`), optional `value` (string, for parameterised keywords like `SCOUTS 6"`).
- **`damageMitigation`** — reduces or prevents damage. Fields: `appliedTo`, `kind`, optional `value`, optional `condition`.
- **`mortalWounds`** — deals mortal wounds. Fields: `appliedTo`, `unitType`, `hits`, `resolution`, `damagePerSuccess`. See Mortal Wounds Effect Category for details.
- **`heal`** — placeholder category for future healing effects. Fields: `appliedTo` only. SHALL NOT be evaluated by the simulator until fully specified.

The ability-level `appliedTo` field is removed. Each effect carries its own `appliedTo`.

#### Scenario: FNP ability

- **WHEN** a unit has Feel No Pain 4+ against mortal wounds
- **THEN** the effect is `{ category: "damageMitigation", kind: "fnp", value: 4, condition: "vsMortalWounds" }`

#### Scenario: Stat set to a fixed value

- **WHEN** a rule sets a characteristic to a fixed value (e.g. invulnerable save becomes 4+)
- **THEN** use `statModifier` with `mode: "setValue"` and `value: 4`

#### Scenario: Halve damage

- **WHEN** a rule halves the damage taken
- **THEN** use `statModifier` with `stat: "Damage"`, `mode: "halve"` (no `value` field)

#### Scenario: Weapon keyword on unit ability

- **WHEN** a unit ability grants IGNORES COVER to all this unit's weapons
- **THEN** use `weaponKeyword` with `weaponTarget: "ALL"` and `keyword: "IGNORES COVER"`

#### Scenario: Reroll failed wound rolls

- **WHEN** a rule allows re-rolling failed wound rolls
- **THEN** use `diceModifier` with `roll: "toWound"` and `action: "rerollFailed"`

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

#### Scenario: Heal category is a stub

- **WHEN** a `heal` effect is present on a structured ability
- **THEN** the simulator ignores it and does not apply any modifier
- **AND** the data is stored for future use

#### Scenario: Unit keyword — Stealth granting benefit of cover

- **WHEN** a unit ability grants Stealth (benefit of cover against ranged attacks)
- **THEN** use `unitKeyword` with `appliedTo: "SelfUnit"`, `keyword: "BENEFIT OF COVER"`, `value: null`

#### Scenario: Unit keyword — Scouts with distance

- **WHEN** a unit ability grants Scouts 6"
- **THEN** use `unitKeyword` with `appliedTo: "SelfUnit"`, `keyword: "SCOUTS"`, `value: "6\""`

#### Scenario: Cover interaction with IGNORES COVER

- **WHEN** a defending unit has a `unitKeyword` effect with `keyword: "BENEFIT OF COVER"` and the attacking weapon has `IGNORES COVER`
- **THEN** the simulator SHALL NOT apply the +1 Save bonus from benefit of cover for that attack
