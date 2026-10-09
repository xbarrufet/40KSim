# Spec Delta

## MODIFIED Requirements

### Requirement: Rule Types

The `effects` array entries SHALL use a `category` field to identify their type. Each category has its own required fields:

- **`statModifier`** — modifies a characteristic. Fields: `target` (`"unit"` or `"weapon"`), `stat`, `mode` (`"add"` | `"subtract"` | `"setValue"` | `"halve"`), and `value` (number, absent for `"halve"`). When `target` is `"weapon"`, a `weaponTarget` field (`"ALL"` | `"RANGE"` | `"MELEE"`) scopes which profiles are affected. Unit stats: `Movement`, `Toughness`, `Save`, `Invulnerable`, `Wounds`, `ObjectiveControl`, `Leadership`. Weapon stats: `Strength`, `Damage`, `Range`, `Attacks`, `AP`, `Skill`.
- **`diceModifier`** — modifies a dice roll. Fields: `roll` (`"toHit"` | `"toWound"` | `"savingThrow"`), `action` (`"rerollOnes"` | `"rerollFailed"` | `"rerollAll"` | `"addToRoll"` | `"subtractFromRoll"` | `"autoSuccess"` | `"ignoreModifiers"`), optional `attackType` (`"RANGE"` | `"MELEE"` | `"ALL"`) scoping which weapon type the modifier applies to.
- **`weaponKeyword`** — grants a keyword to weapon profiles. Fields: `weaponTarget` (`"ALL"` | `"RANGE"` | `"MELEE"`), `keyword` (from the project's known ability vocabulary, e.g. `IGNORES COVER`, `LETHAL HITS`, `DEVASTATING WOUNDS`), optional `value`.
- **`damageMitigation`** — reduces or prevents damage. Fields: `kind` (`"fnp"` | `"damageReduction"` | `"damageHalved"` | `"fightOnDeath"`), optional `value` (number: FNP threshold for `"fnp"`, reduction amount for `"damageReduction"`), optional `condition` (`"any"` | `"vsMortalWounds"` | `"vsPsychic"`).
- **`mortalWounds`** — deals mortal wounds. See Mortal Wounds Effect Category requirement.

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

## ADDED Requirements

### Requirement: Auto-Apply Flag on Structured Abilities

A `StructuredAbility` SHALL support an optional `autoApply: boolean` field. When `autoApply` is `true`, the simulator SHALL apply the ability's effects without presenting the trigger question to the player, exactly as if `trigger` were `"ALWAYS"`. The `trigger` text is preserved and has no effect on simulator behaviour when `autoApply` is `true`.

#### Scenario: autoApply skips the trigger question

- **WHEN** a structured ability has `autoApply: true` and a non-ALWAYS trigger text
- **THEN** the simulator applies its effects without asking the player to confirm the trigger
- **AND** the trigger text is not shown to the player during simulation

#### Scenario: autoApply absent or false — normal behaviour

- **WHEN** a structured ability has no `autoApply` field, or `autoApply: false`, and `trigger` is not `"ALWAYS"`
- **THEN** the simulator presents the trigger question to the player before applying effects

#### Scenario: trigger ALWAYS still works independently

- **WHEN** a structured ability has `trigger: "ALWAYS"` and no `autoApply` field
- **THEN** the simulator applies effects without asking, unchanged from existing behaviour
