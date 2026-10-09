# Spec Delta

## MODIFIED Requirements

### Requirement: Structured Rules

Each structured ability SHALL have an `effects` array encoding its effects for simulation, plus an `attackType` field for automatic phase filtering. An ability may instead be left unstructured (see Unstructured (OTHER) Abilities), in which case it SHALL NOT have an `effects` array.

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

### Requirement: Rule Types

The `effects` array entries SHALL use a `category` field to identify their type. Each category has its own required fields:

- **`statModifier`** — modifies a characteristic. Fields: `target` (`"unit"` or `"weapon"`), `stat`, `mode` (`"add"` | `"subtract"` | `"setValue"` | `"halve"`), and `value` (number, absent for `"halve"`). When `target` is `"weapon"`, a `weaponTarget` field (`"ALL"` | `"RANGE"` | `"MELEE"`) scopes which profiles are affected. Unit stats: `Movement`, `Toughness`, `Save`, `Invulnerable`, `Wounds`, `ObjectiveControl`, `Leadership`. Weapon stats: `Strength`, `Damage`, `Range`, `Attacks`, `AP`, `Skill`.
- **`diceModifier`** — modifies a dice roll. Fields: `roll` (`"toHit"` | `"toWound"` | `"savingThrow"`), `action` (`"rerollOnes"` | `"rerollFailed"` | `"rerollAll"` | `"addToRoll"` | `"subtractFromRoll"` | `"autoSuccess"` | `"ignoreModifiers"`), optional `attackType` (`"RANGE"` | `"MELEE"` | `"ALL"`) scoping which weapon type the modifier applies to.
- **`weaponKeyword`** — grants a keyword to weapon profiles. Fields: `weaponTarget` (`"ALL"` | `"RANGE"` | `"MELEE"`), `keyword` (from the project's known ability vocabulary, e.g. `IGNORES COVER`, `LETHAL HITS`, `DEVASTATING WOUNDS`), optional `value`.
- **`damageMitigation`** — reduces or prevents damage. Fields: `kind` (`"fnp"` | `"damageReduction"` | `"damageHalved"` | `"fightOnDeath"`), optional `value` (number: FNP threshold for `"fnp"`, reduction amount for `"damageReduction"`), optional `condition` (`"any"` | `"vsMortalWounds"` | `"vsPsychic"`).

#### Scenario: FNP ability

- **WHEN** a unit has Feel No Pain 4+ against mortal wounds
- **THEN** the effect is `{ category: "damageMitigation", kind: "fnp", value: 4, condition: "vsMortalWounds" }`

#### Scenario: Stat set to a fixed value

- **WHEN** a rule sets a characteristic to a fixed value (e.g. invulnerable save becomes 4+)
- **THEN** use `statModifier` with `mode: "setValue"` and `value: 4`

#### Scenario: Halve damage

- **WHEN** a rule halves the damage taken
- **THEN** use `statModifier` with `target: "unit"`, `stat: "Damage"`, `mode: "halve"` (no `value` field)

#### Scenario: Weapon keyword on unit ability

- **WHEN** a unit ability grants IGNORES COVER to all this unit's weapons
- **THEN** use `weaponKeyword` with `weaponTarget: "ALL"` and `keyword: "IGNORES COVER"`

#### Scenario: Reroll failed wound rolls

- **WHEN** a rule allows re-rolling failed wound rolls
- **THEN** use `diceModifier` with `roll: "toWound"` and `action: "rerollFailed"`

### Requirement: Rule Target (appliesTo)

The `appliedTo` field on a `StructuredAbility` SHALL default to `"SelfModel"`. Other values remain as defined: `SelfUnit`, `Enemy`, `Ally`. The field applies to the ability as a whole; all effects in `effects[]` share the same target.

#### Scenario: Ability targeting the attached squad

- **WHEN** an `AsLeader` ability affects the unit the leader has joined
- **THEN** `appliedTo` is `"SelfUnit"`

#### Scenario: Ability targeting enemies

- **WHEN** an ability debuffs an enemy unit (e.g. reduces their OC)
- **THEN** `appliedTo` is `"Enemy"`

## ADDED Requirements

### Requirement: Attack Type Field

Each `StructuredAbility` SHALL include an `attackType` field (`"SHOOTING"` | `"FIGHT"` | `"ANY"`) indicating which attack phase the ability applies to. The simulator uses this field to auto-exclude abilities without asking the player.

#### Scenario: Melee-only ability skipped during shooting

- **WHEN** the simulator is resolving a shooting attack and evaluates a unit's abilities
- **THEN** abilities with `attackType: "FIGHT"` are skipped without presenting their trigger to the player

#### Scenario: Phase-neutral ability always evaluated

- **WHEN** an ability applies regardless of attack phase (e.g. a stat bonus that is always active)
- **THEN** `attackType` is `"ANY"` and the simulator evaluates it for both shooting and melee resolution
