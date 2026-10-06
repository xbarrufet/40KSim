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

Each ability SHALL have a `rule` object encoding its effect for simulation.

#### Scenario: Rule with condition
- **WHEN** an ability has a condition other than `"ALWAYS"`
- **THEN** `rule.condition` contains the question the system will ask the player during simulation (e.g. "Is this unit controlling an objective?")

#### Scenario: Always-active rule
- **WHEN** an ability always applies
- **THEN** `rule.condition` is `"ALWAYS"`

### Requirement: Rule Types

The `rule.type` field SHALL be one of:
- `StatModifier` — changes a profile characteristic value (e.g. objectiveControl +1)
- `diceModifier` — modifies a dice roll result without changing the characteristic (e.g. +1 to save rolls)
- `ability` — grants a normalised weapon/core ability (e.g. LETHAL_HITS)

#### Scenario: StatModifier vs diceModifier
- **WHEN** a rule modifies the save characteristic
- **THEN** use `StatModifier` with `target: "save"`
- **WHEN** a rule modifies the save **roll** (per 10th edition rules, these don't always stack the same)
- **THEN** use `diceModifier` with `target: "save"`

### Requirement: Rule Target (appliesTo)

The `rule.appliesTo` field SHALL default to `"self"` (the unit itself). Other values:
- `enemyInRange` — affects an enemy unit meeting the condition
- `allyInRange` — affects an allied unit meeting the condition

Targeting a specific named unit is out of scope for v1.

### Requirement: Ability Types

Each ability has a `type` field indicating its context:
- `Alone` — applies when the unit operates independently
- `AsLeader` — applies when the unit is attached as a leader
- `Always` — applies unconditionally

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
      "rule": { "condition": "ALWAYS", "type": "StatModifier", "target": "objectiveControl", "value": "+1" }
    },
    {
      "type": "AsLeader",
      "name": "Empower",
      "rule": { "condition": "ALWAYS", "type": "ability", "target": "LETHAL_HITS", "value": null }
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
  "rule": { "condition": "Is this unit controlling an objective?", "type": "diceModifier", "appliesTo": "self", "target": "save", "value": "+1" }
}
```

Enemy-targeting aura:
```json
{
  "type": "Always",
  "name": "Terror Troops",
  "rule": { "condition": "Is there an enemy unit within 3\" of this unit?", "type": "StatModifier", "appliesTo": "enemyInRange", "target": "objectiveControl", "value": "-1" }
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
