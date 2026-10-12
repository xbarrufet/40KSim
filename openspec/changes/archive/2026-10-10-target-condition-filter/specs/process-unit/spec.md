# Spec Delta

## ADDED Requirements

### Requirement: Target Condition Selector in Structuring Form

The per-effect structuring form SHALL show an optional "Condición objetivo" section for the effect categories `statModifier`, `diceModifier`, and `weaponKeyword`. The section SHALL contain:

- **Activar**: a toggle (off by default) to enable/disable the target condition. When off, no `targetCondition` is stored on the effect.
- **Modo**: a selector with two options: `Solo contra` (maps to `includes`) and `Excepto contra` (maps to `excludes`). Default: `excludes`.
- **Keywords**: a multi-select of unit keywords (`Vehicle`, `Monster`, `Infantry`, `Character`, `Mounted`, `Fly`, `Walker`, `Titanic`). At least one must be selected when the condition is active.

The section SHALL NOT be shown for `mortalWounds` (which already has its own `unitType` field), `damageMitigation`, `unitKeyword`, or `heal` categories.

#### Scenario: Target condition hidden by default

- **WHEN** the user creates a new `statModifier`, `diceModifier`, or `weaponKeyword` effect
- **THEN** the "Condición objetivo" toggle is off and no condition fields are shown

#### Scenario: Enabling target condition

- **WHEN** the user turns on the "Condición objetivo" toggle
- **THEN** the Modo selector and Keywords multi-select appear
- **AND** Modo defaults to `Excepto contra` (excludes)

#### Scenario: Configuring Lethal Hits non-Vehicle

- **WHEN** the user configures a `weaponKeyword` effect with keyword `LETHAL HITS` and enables the target condition with Modo=`Excepto contra` and selects `Vehicle`
- **THEN** the stored effect has `targetCondition: { keywords: ["VEHICLE"], mode: "excludes" }`

#### Scenario: Disabling target condition clears data

- **WHEN** the user turns off the "Condición objetivo" toggle after configuring it
- **THEN** the `targetCondition` field is removed from the effect

#### Scenario: Target condition not shown for mortalWounds

- **WHEN** the user selects the `mortalWounds` effect category
- **THEN** the "Condición objetivo" section is not visible (mortalWounds uses its own `unitType` field)

#### Scenario: Validation requires at least one keyword

- **WHEN** the user enables the target condition but selects no keywords and saves
- **THEN** the save is blocked and the keywords selector is highlighted as invalid
