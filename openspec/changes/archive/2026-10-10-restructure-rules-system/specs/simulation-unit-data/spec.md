# Spec Delta

## MODIFIED Requirements

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

### Requirement: Rule Types

The `effects` array entries SHALL use a `category` field to identify their type. Each effect SHALL also carry an `appliedTo: AppliesTo` field identifying which unit entity the effect targets. `AppliesTo` values: `"SelfModel"`, `"SelfUnit"`, `"Enemy"`, `"Ally"`. Effect categories and their own required fields:

- **`statModifier`** — modifies a characteristic. Fields: `appliedTo`, `weaponTarget` (required only when the selected `stat` is a `WeaponStat`: `"ALL"` | `"RANGE"` | `"MELEE"`), `stat` (`UnitStat` or `WeaponStat`), `mode` (`"add"` | `"subtract"` | `"setValue"` | `"halve"`), and `value` (number, absent for `"halve"`). The `target: "unit" | "weapon"` field is removed; the stat value itself determines whether it is a unit or weapon stat.
- **`diceModifier`** — modifies a dice roll. Fields: `appliedTo`, `roll` (`"toHit"` | `"toWound"` | `"savingThrow"`), `action` (`"rerollOnes"` | `"rerollFailed"` | `"rerollAll"` | `"addToRoll"` | `"subtractFromRoll"` | `"autoSuccess"` | `"ignoreModifiers"`), optional `attackType` (`"RANGE"` | `"MELEE"` | `"ALL"`).
- **`weaponKeyword`** — grants a keyword to weapon profiles. Fields: `appliedTo`, `weaponTarget` (`"ALL"` | `"RANGE"` | `"MELEE"`), `keyword` (from the project's known ability vocabulary, e.g. `IGNORES COVER`, `LETHAL HITS`, `DEVASTATING WOUNDS`), optional `value`.
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

#### Scenario: Fixed hits

- **WHEN** `hits.kind` is `"fixed"`
- **THEN** exactly `hits.value` resolution attempts are made

#### Scenario: Hits by stat (model count)

- **WHEN** `hits.kind` is `"byStat"` and `hits.stat` is `"models"`
- **THEN** the number of resolution attempts equals the number of eligible models in the unit

#### Scenario: Rolled hits

- **WHEN** `hits.kind` is `"roll"` with `hits.count: 2` and `hits.dice: "D3"`
- **THEN** the simulator rolls 2D3, sums the result, and makes that many resolution attempts

### Requirement: Mortal Wounds Resolution

A `mortalWounds` effect's `resolution` field SHALL be one of two strategies: `always` means every hit automatically succeeds, `roll` requires each hit to meet or exceed a threshold on 1D6.

#### Scenario: Always resolves

- **WHEN** `resolution.kind` is `"always"`
- **THEN** every hit attempt automatically succeeds and deals `damagePerSuccess`

#### Scenario: Roll to resolve

- **WHEN** `resolution.kind` is `"roll"` with `resolution.threshold: 4`
- **THEN** for each hit attempt, the simulator rolls 1D6; results of 4+ succeed and deal `damagePerSuccess`

### Requirement: Mortal Wounds Damage Per Success

A `mortalWounds` effect's `damagePerSuccess` field SHALL default to `{ kind: "fixed", value: 1 }`. It SHALL be one of two strategies: `fixed` deals a constant number of mortal wounds (value 1–10), `roll` rolls dice (count 1–6 of D3 or D6).

#### Scenario: Fixed damage per success

- **WHEN** `damagePerSuccess.kind` is `"fixed"` with `value: 1`
- **THEN** each successful resolution attempt deals exactly 1 mortal wound

#### Scenario: Rolled damage per success

- **WHEN** `damagePerSuccess.kind` is `"roll"` with `count: 1` and `dice: "D3"`
- **THEN** each successful resolution attempt rolls 1D3 and deals that many mortal wounds

## REMOVED Requirements

### Requirement: Mortal Wounds Amount Strategies

**Reason**: Replaced by the new 3-field model (hits, resolution, damagePerSuccess) under the modified Mortal Wounds Effect Category and its sub-requirements (Hit Strategies, Resolution, Damage Per Success).
**Migration**: Existing `amount` data must be re-mapped: `fixed` → hits fixed + resolution always + damagePerSuccess fixed; `roll` → hits fixed(1) + resolution always + damagePerSuccess roll; `perModelRoll` → hits byStat(models) + resolution roll + damagePerSuccess fixed; `multiDiceCount` → hits fixed(diceCount) + resolution roll + damagePerSuccess fixed.

### Requirement: Deferred Game Events

**Reason**: The `gameEvent` field is removed from `MortalWoundsEffect`. Phase is now specified at the ability level via the `phase` field. `onDestroyed` and `onMove` are no longer needed as separate event types since `MOVEMENT` is now a valid phase value and `onDestroyed` remains out of simulation scope.
**Migration**: Existing `gameEvent: "onCharge"` → set ability `phase: "CHARGE"`. `gameEvent: "activeAbility"` → set ability `phase` to the appropriate game phase. `gameEvent: "onMove"` → set ability `phase: "MOVEMENT"`. `gameEvent: "onDestroyed"` → mark ability as OTHER (not simulatable).
