# Spec Delta

## ADDED Requirements

### Requirement: Specific Weapon Options in Effect Dropdowns
The weapon selector dropdowns in the structuring form (for `statModifier`, `diceModifier`, and `weaponKeyword` effect categories) SHALL display the unit's specific weapon names as additional options below the three generic options (`Todas`, `Distancia`, `Cuerpo a Cuerpo`). The weapon names SHALL be extracted from the unit's wargear data and grouped by type (ranged first, then melee), separated by optgroup headers.

#### Scenario: Dropdown shows unit weapons for statModifier
- **WHEN** the user selects a weapon stat (Strength, Damage, Range, Attacks, AP, Skill) in a `statModifier` effect for a unit that has weapons "Heavy Bolt Pistol", "Twin Bolt Rifle", "Chainsword", and "Thunder Hammer"
- **THEN** the "Arma" dropdown SHALL show: `Todas`, `Distancia`, `Cuerpo a Cuerpo`, then an optgroup "Distancia" with `Heavy Bolt Pistol` and `Twin Bolt Rifle`, then an optgroup "Cuerpo a Cuerpo" with `Chainsword` and `Thunder Hammer`

#### Scenario: Dropdown shows unit weapons for diceModifier
- **WHEN** the user configures a `diceModifier` effect for a unit with weapons
- **THEN** the "Arma" dropdown SHALL show the same structure: generic options followed by specific weapon names grouped by type

#### Scenario: Dropdown shows unit weapons for weaponKeyword
- **WHEN** the user configures a `weaponKeyword` effect for a unit with weapons
- **THEN** the "Arma" dropdown SHALL show the same structure: generic options followed by specific weapon names grouped by type

#### Scenario: Deduplication of weapon names
- **WHEN** a unit has the same weapon name appearing across multiple models (e.g. both Outrider and Outrider Sergeant carry "Chainsword")
- **THEN** the dropdown SHALL show that weapon name only once
