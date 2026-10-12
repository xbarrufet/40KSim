# Spec Delta

## MODIFIED Requirements

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
