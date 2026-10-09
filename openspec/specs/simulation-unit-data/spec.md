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

- **`statModifier`** — modifies a characteristic. Fields: `appliedTo`, `weaponTarget` (required only when the selected `stat` is a `WeaponStat`: `"ALL"` | `"RANGE"` | `"MELEE"`), `stat` (`UnitStat` or `WeaponStat`), `mode` (`"add"` | `"subtract"` | `"setValue"` | `"halve"`), and `value` (number, absent for `"halve"`). The `target: "unit" | "weapon"` field is removed; the stat value itself determines whether it is a unit or weapon stat.
- **`diceModifier`** — modifies a dice roll. Fields: `appliedTo`, `roll` (`"toHit"` | `"toWound"` | `"savingThrow"`), `action` (`"rerollOnes"` | `"rerollFailed"` | `"rerollAll"` | `"addToRoll"` | `"subtractFromRoll"` | `"autoSuccess"` | `"ignoreModifiers"`), optional `attackType` (`"RANGE"` | `"MELEE"` | `"ALL"`).
- **`weaponKeyword`** — grants a keyword to weapon profiles. Fields: `appliedTo`, `weaponTarget` (`"ALL"` | `"RANGE"` | `"MELEE"`), `keyword` (from the project's known ability vocabulary, e.g. `IGNORES COVER`, `LETHAL HITS`, `DEVASTATING WOUNDS`), optional `value`.
- **`damageMitigation`** — reduces or prevents damage. Fields: `appliedTo`, `kind`, optional `value`, optional `condition`.
- **`mortalWounds`** — deals mortal wounds. Fields: `appliedTo`, plus all existing mortal wounds fields.

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

### Requirement: Rule Target (appliesTo)

The `appliedTo` field on a `StructuredAbility` SHALL default to `"SelfModel"`. Other values remain as defined: `SelfUnit`, `Enemy`, `Ally`. The field applies to the ability as a whole; all effects in `effects[]` share the same target.

#### Scenario: Ability targeting the attached squad

- **WHEN** an `AsLeader` ability affects the unit the leader has joined
- **THEN** `appliedTo` is `"SelfUnit"`

#### Scenario: Ability targeting enemies

- **WHEN** an ability debuffs an enemy unit (e.g. reduces their OC)
- **THEN** `appliedTo` is `"Enemy"`

### Requirement: Attack Type Field

Each `StructuredAbility` SHALL include an `attackType` field (`"SHOOTING"` | `"FIGHT"` | `"ANY"`) indicating which attack phase the ability applies to. The simulator uses this field to auto-exclude abilities without asking the player.

#### Scenario: Melee-only ability skipped during shooting

- **WHEN** the simulator is resolving a shooting attack and evaluates a unit's abilities
- **THEN** abilities with `attackType: "FIGHT"` are skipped without presenting their trigger to the player

#### Scenario: Phase-neutral ability always evaluated

- **WHEN** an ability applies regardless of attack phase (e.g. a stat bonus that is always active)
- **THEN** `attackType` is `"ANY"` and the simulator evaluates it for both shooting and melee resolution

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

### Requirement: Ability Types

Each ability SHALL have a `type` field indicating its context:
- `Alone` — applies when the unit operates independently
- `AsLeader` — applies when the unit is attached as a leader
- `Always` — applies unconditionally

#### Scenario: Ability context values
- **WHEN** an ability's `type` is `Alone`, `AsLeader`, or `Always`
- **THEN** the simulator applies it only in the corresponding context (operating independently, attached as a leader, or unconditionally)

### Requirement: Mortal Wounds Effect Category

The `effects` array SHALL support a `mortalWounds` category for abilities that actively deal mortal wounds. A `mortalWounds` effect SHALL encode: `gameEvent` (when it fires), optional `preRoll` (gate roll), `targetScope` (which units are affected), optional `range`, base `amount`, and optional `amountByKeyword` overrides resolved most-restrictive-first.

#### Scenario: Per-model charge roll (Hammer of Wrath pattern)
- **WHEN** an ability deals mortal wounds for each model that lands a hit at the end of a charge
- **THEN** the effect is `{ category: "mortalWounds", gameEvent: "onCharge", targetScope: "engagedUnit", amount: { kind: "perModelRoll", threshold: 4, onSuccess: 1 } }`
- **AND** the simulator rolls one D6 per model in this unit engaged with the target, counts results at or above `threshold`, and multiplies by `onSuccess` to get the total mortal wounds

#### Scenario: Active ability with gate roll and keyword override (Haywire Mine pattern)
- **WHEN** an ability is player-activated in the Shooting phase, has a gate roll, and deals different mortal wounds depending on the target's keywords
- **THEN** the effect encodes `gameEvent: "activeAbility"`, a `preRoll` with `dice` and `threshold`, `targetScope: "selectedEnemyUnit"`, `range`, a base `amount`, and `amountByKeyword` listing each keyword override most-restrictive-first
- **AND** the simulator first rolls the `preRoll` dice and stops if the result is below `threshold`
- **AND** for the selected target, the simulator checks `amountByKeyword` in order and uses the first entry whose `targetKeyword` appears in the target unit's keyword list; if none match, the base `amount` is used

#### Scenario: Gate roll fails — no mortal wounds
- **WHEN** a `mortalWounds` effect has a `preRoll` and the rolled value is below `threshold`
- **THEN** no mortal wounds are dealt and no further steps of that effect are evaluated

#### Scenario: Keyword override applies
- **WHEN** the target unit has a keyword that matches an entry in `amountByKeyword`
- **THEN** the matching entry's `amount` is used instead of the base `amount`
- **AND** only the first matching entry is applied (most-restrictive-first ordering)

#### Scenario: No keyword override — base amount used
- **WHEN** the target unit's keywords do not match any entry in `amountByKeyword`
- **THEN** the base `amount` is used to calculate mortal wounds

### Requirement: Mortal Wounds Amount Strategies

A `mortalWounds` effect's `amount` SHALL be one of four strategies. `fixed` deals a constant number. `roll` sums `count` dice of size `dice` (D3 or D6) and adds `modifier`. `perModelRoll` rolls one D6 per eligible model, counts results at or above `threshold`, and multiplies by `onSuccess`. `multiDiceCount` rolls `diceCount` dice, counts results at or above `threshold`, and multiplies by `onSuccess`.

#### Scenario: Fixed mortal wounds
- **WHEN** `amount.kind` is `"fixed"`
- **THEN** exactly `amount.value` mortal wounds are dealt

#### Scenario: Rolled mortal wounds (D3 variant)
- **WHEN** `amount.kind` is `"roll"` with `dice: "D3"`
- **THEN** the simulator rolls `count` D3 dice (default 1), sums them, adds `modifier` (default 0), and deals that many mortal wounds

#### Scenario: Rolled mortal wounds (2D3 variant)
- **WHEN** `amount.kind` is `"roll"` with `dice: "D3"` and `count: 2`
- **THEN** the simulator rolls two D3 dice, sums them, and deals that many mortal wounds

#### Scenario: Multi-dice count (Thunderhawk Cluster Bombs pattern — deferred)
- **WHEN** `amount.kind` is `"multiDiceCount"`
- **THEN** the simulator rolls `diceCount` D6 dice, counts how many meet or exceed `threshold`, multiplies by `onSuccess`, and deals that many mortal wounds
- **AND** the `onMove` game event that triggers this pattern is deferred to v2 and not evaluated by the v1 simulator

### Requirement: Mortal Wounds Interact With FNP Defence

Each mortal wound dealt by a `mortalWounds` effect SHALL be applied individually, allowing the target unit's `damageMitigation` effect with `kind: "fnp"` and `condition: "vsMortalWounds"` to trigger on each wound.

#### Scenario: FNP roll per mortal wound
- **WHEN** a unit with Feel No Pain 4+ against mortal wounds is targeted by a `mortalWounds` effect that deals 3 mortal wounds
- **THEN** the simulator rolls three separate FNP dice, one per wound, and only wounds that fail the FNP roll are applied

### Requirement: Deferred Game Events

The game events `onDestroyed` (Deadly Demise) and `onMove` (movement-phase abilities) SHALL be valid values in the `MortalWoundsGameEvent` type for forward compatibility but SHALL NOT be evaluated by the v1 simulator.

#### Scenario: onDestroyed event not simulated in v1
- **WHEN** a `mortalWounds` effect has `gameEvent: "onDestroyed"`
- **THEN** the v1 simulator does not evaluate or display it during combat resolution
- **AND** the data is stored without modification so v2 can evaluate it without a re-structuring step

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

## Out of Scope

- Psychic powers and psychic rolls (v1)
- Targeting specific named units (v1)
- Wargear combination validation
- Army list construction / points validation
- Sub-profiles for unit variants (e.g. Sergeant with different weapon) — treated as wargear entries
