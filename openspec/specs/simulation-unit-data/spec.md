# Simulation Unit Data Specification

## Purpose

Define the normalised data format for units used in combat simulation. This format bridges the gap between raw scraped datasheets (BaseData) and the simulation engine, adding structured `rule` objects that encode abilities as conditions + modifiers. The system proposes rules from ability text, but the user manually reviews and adjusts them via the Process Unit screen (future spec).

## Requirements

### Requirement: Simulation Unit Structure

A simulation unit SHALL be assembled, whenever it is needed for display or simulation, by combining a unit's live BaseData (`id`, `slug`, `name`, `keywords`, `stats`, `wargear` with weapon profiles) with its StructuredAbilitiesData (`tag`, `abilities` with structured rules). Only the StructuredAbilitiesData portion SHALL be persisted; the BaseData-derived portion SHALL be read fresh from BaseData each time, never stored as a separate copy.

#### Scenario: Unit with basic stats
- **WHEN** a simulation unit is assembled for a given unit slug
- **THEN** its `id`, `slug`, `name`, `keywords[]`, and `stats` object (movement, toughness, save, invulnerableSave, wounds, leadership, objectiveControl) come from that unit's current BaseData record
- **AND** its `tag` and `abilities` come from that unit's StructuredAbilitiesData record

#### Scenario: No duplicate storage to go stale
- **WHEN** a unit's BaseData is re-uploaded with changed stats or wargear
- **THEN** the next simulation unit assembled for that slug reflects the updated BaseData immediately
- **AND** no separately stored stats/wargear copy needs to be synced or can go stale

### Requirement: Wargear Catalogue

The wargear array SHALL include **all** possible wargear for the unit (default loadout + all options), not just the default. It acts as a flat catalogue for matching by `id` when constructing Army Data.

#### Scenario: Wargear with weapon profiles
- **WHEN** a wargear item has type `weapon`
- **THEN** it contains one or more profiles, each with: id, name, type (melee/ranged), range, attacks, ballisticSkill/weaponSkill, strength, armourPenetration, damage, and abilities[]

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

### Requirement: Rule Types

The `effects` array entries SHALL use a `category` field to identify their type. Each effect SHALL also carry an `appliedTo: AppliesTo` field identifying which unit entity the effect targets. `AppliesTo` values: `"SelfModel"`, `"SelfUnit"`, `"Enemy"`, `"Ally"`. Effect categories and their own required fields:

- **`statModifier`** — modifies a characteristic. Fields: `appliedTo`, `weaponTarget` (required only when the selected `stat` is a `WeaponStat`: `"ALL"` | `"RANGE"` | `"MELEE"` | `<weapon-name>`), `stat` (`UnitStat` or `WeaponStat`), `mode` (`"add"` | `"subtract"` | `"setValue"` | `"halve"`), and `value` (number, absent for `"halve"`). When `weaponTarget` is a string that is not `"ALL"`, `"RANGE"`, or `"MELEE"`, it SHALL be interpreted as a specific weapon name and the effect SHALL apply only to weapon profiles whose name matches that string (case-insensitive). The `target: "unit" | "weapon"` field is removed; the stat value itself determines whether it is a unit or weapon stat.
- **`diceModifier`** — modifies a dice roll. Fields: `appliedTo`, `roll` (`"toHit"` | `"toWound"` | `"savingThrow"` | `"damage"` | `"hazard"` | `"charge"`), `action` (`"rerollOnes"` | `"rerollFailed"` | `"rerollAll"` | `"addToRoll"` | `"subtractFromRoll"` | `"autoSuccess"` | `"ignoreModifiers"`), optional `attackType` (`"RANGE"` | `"MELEE"` | `"ALL"` | `<weapon-name>`). When `attackType` is a string that is not `"RANGE"`, `"MELEE"`, or `"ALL"`, it SHALL be interpreted as a specific weapon name and the effect SHALL apply only to attacks made with weapon profiles whose name matches that string (case-insensitive).
- **`weaponKeyword`** — grants a keyword to weapon profiles. Fields: `appliedTo`, `weaponTarget` (`"ALL"` | `"RANGE"` | `"MELEE"` | `<weapon-name>`), `keyword` (from the project's known ability vocabulary, e.g. `IGNORES COVER`, `LETHAL HITS`, `DEVASTATING WOUNDS`), optional `value`. When `weaponTarget` is a specific weapon name, the keyword SHALL be granted only to that weapon's profiles.
- **`unitKeyword`** — grants a keyword to a unit. Fields: `appliedTo`, `keyword` (from a known unit keyword vocabulary: `BENEFIT OF COVER`, `STEALTH`, `SCOUTS`, `DEEP STRIKE`, `LONE OPERATIVE`, `FIGHTS FIRST`), optional `value` (string, for parameterised keywords like `SCOUTS 6"`).
- **`damageMitigation`** — reduces or prevents damage. Fields: `appliedTo`, `kind`, optional `value`, optional `condition`.
- **`mortalWounds`** — deals mortal wounds. Fields: `appliedTo`, `unitType`, `hits`, `resolution`, `damagePerSuccess`. See Mortal Wounds Effect Category for details.
- **`heal`** — restores lost wounds to models. Fields: `appliedTo`, `amount` (dice notation string, e.g. `"1D3+3"`, `"1"`, `"D6"`). The `amount` field uses the same dice notation format as other notation fields in the system.

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

#### Scenario: Reroll damage rolls

- **WHEN** a rule allows re-rolling damage rolls for ranged attacks
- **THEN** use `diceModifier` with `roll: "damage"`, `action: "rerollAll"`, and `attackType: "RANGE"`

#### Scenario: Modify hazard roll

- **WHEN** a rule modifies the hazard roll (overcharge explosion check) for a weapon
- **THEN** use `diceModifier` with `roll: "hazard"` and the appropriate action

#### Scenario: Modify charge roll

- **WHEN** a rule adds +1 to the charge roll
- **THEN** use `diceModifier` with `roll: "charge"` and `action: "addToRoll"`

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

#### Scenario: Heal effect with amount

- **WHEN** a structured ability has a heal effect with `amount: "1D3+3"`
- **THEN** the simulator SHALL use the dice notation to determine how many wounds are restored

#### Scenario: Heal effect backward compatibility

- **WHEN** a heal effect has no `amount` field (legacy data)
- **THEN** the system SHALL treat it as `amount: "1"` by default

#### Scenario: Unit keyword — Stealth granting benefit of cover

- **WHEN** a unit ability grants Stealth (benefit of cover against ranged attacks)
- **THEN** use `unitKeyword` with `appliedTo: "SelfUnit"`, `keyword: "BENEFIT OF COVER"`, `value: null`

#### Scenario: Unit keyword — Scouts with distance

- **WHEN** a unit ability grants Scouts 6"
- **THEN** use `unitKeyword` with `appliedTo: "SelfUnit"`, `keyword: "SCOUTS"`, `value: "6\""`

#### Scenario: Cover interaction with IGNORES COVER

- **WHEN** a defending unit has a `unitKeyword` effect with `keyword: "BENEFIT OF COVER"` and the attacking weapon has `IGNORES COVER`
- **THEN** the simulator SHALL NOT apply the +1 Save bonus from benefit of cover for that attack

#### Scenario: Stat modifier targets a specific weapon by name

- **WHEN** a `statModifier` effect has `weaponTarget` set to `"Thunder Hammer"`
- **THEN** the effect SHALL apply only to weapon profiles whose name is "Thunder Hammer" (case-insensitive match) and SHALL NOT affect other weapon profiles

#### Scenario: Dice modifier targets a specific weapon by name

- **WHEN** a `diceModifier` effect has `attackType` set to `"Twin Bolt Rifle"`
- **THEN** the effect SHALL apply only to attacks made with the "Twin Bolt Rifle" weapon profile and SHALL NOT affect attacks with other weapons

#### Scenario: Weapon keyword targets a specific weapon by name

- **WHEN** a `weaponKeyword` effect has `weaponTarget` set to `"Chainsword"`
- **THEN** the keyword SHALL be granted only to the "Chainsword" weapon profile

#### Scenario: Generic weapon targets remain unchanged

- **WHEN** an effect has `weaponTarget` or `attackType` set to `"ALL"`, `"RANGE"`, or `"MELEE"`
- **THEN** the effect SHALL apply to all weapons, all ranged weapons, or all melee weapons respectively, as before

#### Scenario: Case-insensitive weapon name matching

- **WHEN** a `statModifier` effect has `weaponTarget` set to `"thunder hammer"` and the unit has a weapon named `"Thunder Hammer"`
- **THEN** the effect SHALL match and apply to that weapon profile

### Requirement: Rule Target (appliesTo)

The `appliedTo` field on a `StructuredAbility` SHALL default to `"SelfModel"`. Other values remain as defined: `SelfUnit`, `Enemy`, `Ally`. The field applies to the ability as a whole; all effects in `effects[]` share the same target.

#### Scenario: Ability targeting the attached squad

- **WHEN** an `AsLeader` ability affects the unit the leader has joined
- **THEN** `appliedTo` is `"SelfUnit"`

#### Scenario: Ability targeting enemies

- **WHEN** an ability debuffs an enemy unit (e.g. reduces their OC)
- **THEN** `appliedTo` is `"Enemy"`

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

### Requirement: Unstructured (OTHER) Abilities

An ability SHALL be representable without a structured `rule`, by setting `category: "OTHER"` and preserving the original ability text in a `text` field. Such abilities SHALL NOT affect simulation calculations.

#### Scenario: Ability kept as display-only text
- **WHEN** an ability has `category: "OTHER"`
- **THEN** it has a `text` field containing the original BaseData ability text
- **AND** it has no `rule` field
- **AND** the simulation engine does not apply any modifier or attribute from it — it is shown to the user for reference only

### Requirement: UnitData Review Tag

A StructuredAbilitiesData record SHALL include a `tag` field whose value is `"PENDING"` or `"CONFIRMED"`, indicating whether it has passed manual review on the Process Unit screen.

#### Scenario: Newly generated UnitData
- **WHEN** StructuredAbilitiesData is generated automatically from a BaseData upload
- **THEN** its `tag` is `"PENDING"`

#### Scenario: Reviewed and saved UnitData
- **WHEN** a user saves the Process Unit screen for a unit
- **THEN** its `tag` is `"CONFIRMED"`

### Requirement: Mortal Wounds Effect Category

The `effects` array SHALL support a `mortalWounds` category for abilities that actively deal mortal wounds. A `mortalWounds` effect SHALL encode: `appliedTo`, `unitType` (target unit type filter), `hits` (how many impact attempts), `resolution` (always or roll threshold), and `damagePerSuccess` (mortal wounds per successful hit).

The fields `gameEvent`, `preRoll`, `targetScope`, `range`, `amount`, and `amountByKeyword` are removed. Phase is now specified at the ability level via the `phase` field. The pre-roll gate is absorbed into `resolution`. Target scope is implicit from the selected phase. Keyword-based overrides are replaced by creating multiple effects with different `unitType` values.

#### Scenario: Per-model charge roll (Hammer of Wrath pattern)

- **WHEN** an ability deals mortal wounds for each model that lands a hit at the end of a charge
- **THEN** the ability has `phase: "CHARGE"` and the effect is `{ category: "mortalWounds", appliedTo: "Enemy", unitType: "ALL", hits: { kind: "byStat", stat: "models" }, resolution: { kind: "roll", threshold: 4 }, damagePerSuccess: { kind: "fixed", value: 1 } }`
- **AND** the simulator rolls one D6 per model engaged with the target, counts results at or above 4, and deals 1 mortal wound per success

#### Scenario: Active ability with gate roll and unit-type override (Haywire Mine pattern)

- **WHEN** an ability is player-activated in the Shooting phase, has a gate roll, and deals different mortal wounds to vehicles
- **THEN** the ability has `phase: "SHOOTING"` and two effects:
  - `{ category: "mortalWounds", unitType: "ALL", hits: { kind: "fixed", value: 1 }, resolution: { kind: "roll", threshold: 2 }, damagePerSuccess: { kind: "roll", count: 1, dice: "D3" } }`
  - `{ category: "mortalWounds", unitType: "VEHICLE", hits: { kind: "fixed", value: 1 }, resolution: { kind: "roll", threshold: 2 }, damagePerSuccess: { kind: "roll", count: 2, dice: "D3" } }`
- **AND** the simulator uses the most restrictive matching `unitType` effect

#### Scenario: Multi-dice bombardment (Thunderhawk Cluster Bombs pattern)

- **WHEN** an ability rolls multiple dice and each success deals mortal wounds
- **THEN** the ability has `phase: "MOVEMENT"` and the effect is `{ category: "mortalWounds", unitType: "ALL", hits: { kind: "fixed", value: 6 }, resolution: { kind: "roll", threshold: 3 }, damagePerSuccess: { kind: "fixed", value: 1 } }`

#### Scenario: Simple flat mortal wounds

- **WHEN** an ability deals a fixed number of mortal wounds with no roll
- **THEN** the effect is `{ category: "mortalWounds", unitType: "ALL", hits: { kind: "fixed", value: 3 }, resolution: { kind: "always" }, damagePerSuccess: { kind: "fixed", value: 1 } }`

#### Scenario: Unit type resolution order

- **WHEN** a unit has two mortal wounds effects, one with `unitType: "ALL"` and another with `unitType: "VEHICLE"`
- **THEN** the simulator checks the target's keywords and uses the most restrictive match (`VEHICLE` over `ALL`)
- **AND** if no specific type matches, falls back to `ALL`

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

### Requirement: Mortal Wounds Resolution

A `mortalWounds` effect's `resolution` field SHALL be one of two strategies: `always` means every hit automatically succeeds, `roll` requires each hit to meet or exceed a threshold on 1D6.

#### Scenario: Always resolves

- **WHEN** `resolution.kind` is `"always"`
- **THEN** every hit attempt automatically succeeds and deals `damagePerSuccess`

#### Scenario: Roll to resolve

- **WHEN** `resolution.kind` is `"roll"` with `resolution.threshold: 4`
- **THEN** for each hit attempt, the simulator rolls 1D6; results of 4+ succeed and deal `damagePerSuccess`

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

### Requirement: Mortal Wounds Interact With FNP Defence

Each mortal wound dealt by a `mortalWounds` effect SHALL be applied individually, allowing the target unit's `damageMitigation` effect with `kind: "fnp"` and `condition: "vsMortalWounds"` to trigger on each wound.

#### Scenario: FNP roll per mortal wound
- **WHEN** a unit with Feel No Pain 4+ against mortal wounds is targeted by a `mortalWounds` effect that deals 3 mortal wounds
- **THEN** the simulator rolls three separate FNP dice, one per wound, and only wounds that fail the FNP roll are applied

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

## Data Structures

### Simulation Unit Example

```json
{
  "id": 47128,
  "slug": "ancient",
  "name": "Ancient",
  "keywords": ["CHARACTER", "INFANTRY", "IMPERIUM", "TACTICUS"],
  "stats": {
    "movement": 6, "toughness": 5, "save": 3,
    "invulnerableSave": null, "wounds": 4,
    "leadership": 6, "objectiveControl": 2
  },
  "wargear": [
    {
      "wargearItem": {
        "id": 107454,
        "name": "Ceramite Fists",
        "wargearType": "weapon",
        "count": 1,
        "profiles": [
          {
            "id": 113492, "name": "Ceramite Fists",
            "type": "melee", "range": "Melee",
            "attacks": "4", "weaponSkill": 3,
            "strength": "5", "armourPenetration": "0", "damage": "1",
            "abilities": [
              { "id": 3383, "name": "HEAVY", "value": null },
              { "id": 3461, "name": "RAPID FIRE", "value": "1" }
            ]
          }
        ]
      }
    }
  ],
  "abilities": [
    {
      "type": "Alone",
      "name": "Honour of the Company",
      "rule": { "trigger": "ALWAYS", "appliedTo": "SelfModel", "type": "unitStatsModifier", "stat": "ObjectiveControl", "value": "+1" }
    },
    {
      "type": "AsLeader",
      "name": "Empower",
      "rule": { "trigger": "ALWAYS", "appliedTo": "SelfUnit", "type": "addAttribute", "weaponTarget": "ALL", "attribute": "LETHAL HITS", "value": null }
    }
  ]
}
```

### Rule Examples

Self-targeting diceModifier:
```json
{
  "type": "Always",
  "name": "Unyielding in the Face of the Foe",
  "rule": { "trigger": "Is this unit controlling an objective?", "appliedTo": "SelfModel", "type": "diceModifier", "throw": "Save", "modifier": { "kind": "adjust", "value": "+1" } }
}
```

Enemy-targeting aura:
```json
{
  "type": "Always",
  "name": "Terror Troops",
  "rule": { "trigger": "Is there an enemy unit within 3\" of this unit?", "appliedTo": "Enemy", "type": "unitStatsModifier", "stat": "ObjectiveControl", "value": "-1" }
}
```

## Army Data (Deployed Units)

Army Data is built by combining an imported army list with Simulation Unit data. Each deployed unit is an independent instance referencing its base unit by `id`/`slug`.

### Army Unit Example

```json
{
  "instanceId": "army-unit-001",
  "name": "Intercessor Squad",
  "points": 170,
  "bodyguard": {
    "baseUnit": { "id": 46861, "slug": "intercessor-squad" },
    "count": 5,
    "wargear": [
      { "wargearItemId": 108237, "count": 4 },
      { "wargearItemId": 109900, "count": 1 }
    ]
  },
  "leader": {
    "baseUnit": { "id": 47128, "slug": "ancient" },
    "wargear": [{ "wargearItemId": 107454, "count": 1 }]
  },
  "leaderSupport": null
}
```

- `bodyguard`: base unit repeated `count` times; `leader`/`leaderSupport` are null or an object (always 1 model)
- `wargear[].wargearItemId` references a `wargearItem.id` in the Simulation Unit; stats resolved at simulation time
- `points` is informational only (not recalculated)
- Army list construction (slots, points validation, wargear combos) is out of scope — the imported list is assumed correct

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

## Out of Scope

- Psychic powers and psychic rolls (v1)
- Targeting specific named units (v1)
- Wargear combination validation
- Army list construction / points validation
- Sub-profiles for unit variants (e.g. Sergeant with different weapon) — treated as wargear entries
