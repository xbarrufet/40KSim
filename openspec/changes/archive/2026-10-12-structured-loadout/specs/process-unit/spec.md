# Spec Delta

## ADDED Requirements

### Requirement: Loadout Options Section

The Process Unit screen SHALL include an "Opciones de Loadout" section below the existing abilities review section. This section SHALL load and display the unit's `loadout_data` record when one exists.

#### Scenario: Section placement
- **WHEN** the Process Unit screen is rendered for a unit with loadout data
- **THEN** the "Opciones de Loadout" section SHALL appear below the abilities review section

#### Scenario: Section absent without data
- **WHEN** the Process Unit screen is rendered for a unit without loadout data
- **THEN** no loadout section SHALL appear

### Requirement: Loadout Save Independent of Abilities Save

The "Guardar Loadout" action SHALL be independent of the abilities "Guardar" action. Each can be saved separately without affecting the other.

#### Scenario: Save loadout without saving abilities
- **WHEN** the user saves the loadout section without changes to abilities
- **THEN** only the `loadout_data` record SHALL be updated; the `unit_data` record SHALL remain unchanged

#### Scenario: Save abilities without saving loadout
- **WHEN** the user saves abilities without changes to loadout
- **THEN** only the `unit_data` record SHALL be updated; the `loadout_data` record SHALL remain unchanged
