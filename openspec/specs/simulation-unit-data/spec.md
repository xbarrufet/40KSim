# Simulation Unit Data Specification

## Purpose

Define the normalised data format for units used in combat simulation. This format bridges the gap between raw scraped datasheets (BaseData) and the simulation engine, adding structured `rule` objects that encode abilities as conditions + modifiers. The system proposes rules from ability text, but the user manually reviews and adjusts them via the Process Unit screen (future spec).

## Requirements

### Requirement: Simulation Unit Structure

Each simulation unit SHALL contain: id, slug, name, keywords, stats, wargear (with weapon profiles), and abilities (with structured rules).

#### Scenario: Unit with basic stats
- **WHEN** a simulation unit is loaded
- **THEN** it contains `id`, `slug`, `name`, `keywords[]`, and a `stats` object with movement, toughness, save, invulnerableSave (nullable), wounds, leadership, objectiveControl

### Requirement: Wargear Catalogue

The wargear array SHALL include **all** possible wargear for the unit (default loadout + all options), not just the default. It acts as a flat catalogue for matching by `id` when constructing Army Data.

#### Scenario: Wargear with weapon profiles
- **WHEN** a wargear item has type `weapon`
- **THEN** it contains one or more profiles, each with: id, name, type (melee/ranged), range, attacks, ballisticSkill/weaponSkill, strength, armourPenetration, damage, and abilities[]

### Requirement: Structured Rules

Each structured ability SHALL have a `rule` object encoding its effect for simulation. An ability may instead be left unstructured (see Unstructured (OTHER) Abilities), in which case it SHALL NOT have a `rule`.

#### Scenario: Rule with condition
- **WHEN** an ability has a trigger other than `"ALWAYS"`
- **THEN** `rule.trigger` contains the question the system will ask the player during simulation (e.g. "Is this unit controlling an objective?")

#### Scenario: Always-active rule
- **WHEN** an ability always applies
- **THEN** `rule.trigger` is `"ALWAYS"`

### Requirement: Rule Types

The `rule.type` field SHALL be one of `unitStatsModifier`, `weaponStatsModifier`, `diceModifier`, or `addAttribute`, each with its own fields:

- `unitStatsModifier` — changes a unit-level characteristic. Has a `stat` field, one of `Movement`, `Toughness`, `Save`, `Invulnerable`, `Wounds`, `ObjectiveControl`, `Leadership`, plus a `value` (e.g. `objectiveControl` stat +1).
- `weaponStatsModifier` — changes a weapon-profile characteristic. Has a `weaponTarget` field (`ALL`, `RANGE`, or `MELEE`) scoping which of the unit's weapon profiles are affected, a `stat` field, one of `Strength`, `Damage`, `Range`, `Attacks`, `AP`, `Skill` (`Skill` resolves to the targeted profile's `ballisticSkill` when ranged or `weaponSkill` when melee), plus a `value`.
- `diceModifier` — modifies a dice roll result without changing the underlying characteristic. Has a `throw` field, one of `Hit`, `Wound`, `Save`, `Damage`, `Battleshock`, and a `modifier` that is either a flat adjustment (`{ kind: "adjust", value }`, e.g. +1 to save rolls) or a reroll instruction (`{ kind: "reroll", reroll: "1" | "ALL" }`).
- `addAttribute` — grants a normalised weapon/core ability. Has a `weaponTarget` field (`ALL`, `RANGE`, or `MELEE`) scoping which weapon profiles receive the attribute, and an `attribute` field restricted to the project's known ability vocabulary (e.g. `SUSTAINED HITS`), plus an optional qualifier `value` (e.g. `"1"` in `SUSTAINED HITS 1`).

#### Scenario: Unit-level stat change
- **WHEN** a rule changes a unit's own characteristic (e.g. objectiveControl +1)
- **THEN** use `unitStatsModifier` with `stat: "ObjectiveControl"` and `value: "+1"`

#### Scenario: Weapon-level stat change scoped by weapon type
- **WHEN** a rule changes a characteristic of this unit's weapons, and the effect differs between ranged and melee weapons (or applies to only one)
- **THEN** use `weaponStatsModifier` with `weaponTarget` set to `"RANGE"`, `"MELEE"`, or `"ALL"` and the relevant `stat`

#### Scenario: StatModifier vs diceModifier
- **WHEN** a rule modifies the save characteristic itself
- **THEN** use `unitStatsModifier` with `stat: "Save"`
- **WHEN** a rule instead modifies the save **roll** (per 10th edition rules, these don't always stack the same as a characteristic change)
- **THEN** use `diceModifier` with `throw: "Save"`

#### Scenario: Reroll vs flat adjustment
- **WHEN** a rule rerolls a dice result (e.g. "reroll Wound rolls of 1") rather than adding to or subtracting from it
- **THEN** use `diceModifier` with `modifier: { kind: "reroll", reroll: "1" }` (or `"ALL"` to reroll all failed/all results, per the ability's wording)
- **WHEN** a rule instead adds to or subtracts from the roll (e.g. "+1 to Hit")
- **THEN** use `diceModifier` with `modifier: { kind: "adjust", value: "+1" }`

#### Scenario: Granting an attribute restricted to known vocabulary
- **WHEN** a rule grants a weapon/core ability keyword
- **THEN** `addAttribute.attribute` SHALL be one of the project's known ability keywords (the same vocabulary used to automatically parse weapon-profile abilities per the Weapon-Level Ability Parsing requirement in `process-unit`), not an arbitrary string

### Requirement: Rule Target (appliesTo)

The `rule.appliedTo` field SHALL default to `"SelfModel"` (this model/unit's own profile). Other values:
- `SelfUnit` — only meaningful when the ability's `type` is `AsLeader`; affects the unit the leader has joined, not the leader's own model
- `Enemy` — affects an enemy unit meeting the trigger condition
- `Ally` — affects an allied unit meeting the trigger condition

Targeting a specific named unit is out of scope for v1.

#### Scenario: SelfModel vs SelfUnit for a leader ability
- **WHEN** an `AsLeader` ability affects only the leader's own characteristics
- **THEN** `rule.appliedTo` is `"SelfModel"`
- **WHEN** an `AsLeader` ability affects the squad the leader has joined
- **THEN** `rule.appliedTo` is `"SelfUnit"`

### Requirement: Unstructured (OTHER) Abilities

An ability SHALL be representable without a structured `rule`, by setting `category: "OTHER"` and preserving the original ability text in a `text` field. Such abilities SHALL NOT affect simulation calculations.

#### Scenario: Ability kept as display-only text
- **WHEN** an ability has `category: "OTHER"`
- **THEN** it has a `text` field containing the original BaseData ability text
- **AND** it has no `rule` field
- **AND** the simulation engine does not apply any modifier or attribute from it — it is shown to the user for reference only

### Requirement: UnitData Review Tag

A UnitData record SHALL include a `tag` field whose value is `"PENDING"` or `"CONFIRMED"`, indicating whether it has passed manual review on the Process Unit screen.

#### Scenario: Newly generated UnitData
- **WHEN** UnitData is generated automatically from a BaseData upload
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
