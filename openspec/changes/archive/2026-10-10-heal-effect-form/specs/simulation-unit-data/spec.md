# Spec Delta

## MODIFIED Requirements

### Requirement: Rule Types
The `effects` array entries SHALL use a `category` field to identify their type. Each effect SHALL also carry an `appliedTo: AppliesTo` field identifying which unit entity the effect targets. `AppliesTo` values: `"SelfModel"`, `"SelfUnit"`, `"Enemy"`, `"Ally"`. Effect categories and their own required fields:
- **`statModifier`** — modifies a characteristic. Fields: `appliedTo`, `weaponTarget` (required only when the selected `stat` is a `WeaponStat`: `"ALL"` | `"RANGE"` | `"MELEE"`), `stat` (`UnitStat` or `WeaponStat`), `mode` (`"add"` | `"subtract"` | `"setValue"` | `"halve"`), and `value` (number, absent for `"halve"`). The `target: "unit" | "weapon"` field is removed; the stat value itself determines whether it is a unit or weapon stat.
- **`diceModifier`** — modifies a dice roll. Fields: `appliedTo`, `roll` (`"toHit"` | `"toWound"` | `"savingThrow"` | `"damage"` | `"hazard"`), `action` (`"rerollOnes"` | `"rerollFailed"` | `"rerollAll"` | `"addToRoll"` | `"subtractFromRoll"` | `"autoSuccess"` | `"ignoreModifiers"`), optional `attackType` (`"RANGE"` | `"MELEE"` | `"ALL"`).
- **`weaponKeyword`** — grants a keyword to weapon profiles. Fields: `appliedTo`, `weaponTarget` (`"ALL"` | `"RANGE"` | `"MELEE"`), `keyword` (from the project's known ability vocabulary, e.g. `IGNORES COVER`, `LETHAL HITS`, `DEVASTATING WOUNDS`), optional `value`.
- **`unitKeyword`** — grants a keyword to a unit. Fields: `appliedTo`, `keyword` (from a known unit keyword vocabulary: `BENEFIT OF COVER`, `STEALTH`, `SCOUTS`, `DEEP STRIKE`, `LONE OPERATIVE`, `FIGHTS FIRST`), optional `value` (string, for parameterised keywords like `SCOUTS 6"`).
- **`damageMitigation`** — reduces or prevents damage. Fields: `appliedTo`, `kind`, optional `value`, optional `condition`.
- **`mortalWounds`** — deals mortal wounds. Fields: `appliedTo`, `unitType`, `hits`, `resolution`, `damagePerSuccess`. See Mortal Wounds Effect Category for details.
- **`heal`** — restores lost wounds to models. Fields: `appliedTo`, `amount` (dice notation string, e.g. `"1D3+3"`, `"1"`, `"D6"`). The `amount` field uses the same dice notation format as other notation fields in the system.
The ability-level `appliedTo` field is removed. Each effect carries its own `appliedTo`.

#### Scenario: Heal effect with amount
- **WHEN** a structured ability has a heal effect with `amount: "1D3+3"`
- **THEN** the simulator SHALL use the dice notation to determine how many wounds are restored

#### Scenario: Heal effect backward compatibility
- **WHEN** a heal effect has no `amount` field (legacy data)
- **THEN** the system SHALL treat it as `amount: "1"` by default
