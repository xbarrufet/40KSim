# Spec Delta

## Purpose

Defines the parent-faction inheritance model for Space Marines subfactions, enabling shared units to resolve their data from the parent faction and ensuring edits to shared units propagate across all subfactions.

## ADDED Requirements

### Requirement: Parent Faction Map

The app SHALL define a static map of subfaction slugs to their parent faction slug. The map SHALL include: `black-templars`, `blood-angels`, `dark-angels`, `deathwatch`, `imperial-fists`, `iron-hands`, `raven-guard`, `salamanders`, `space-wolves`, `ultramarines`, `white-scars` — all mapping to `space-marines`. Grey Knights SHALL NOT be included.

#### Scenario: Known subfaction
- **WHEN** the app resolves the parent for `imperial-fists`
- **THEN** the result SHALL be `space-marines`

#### Scenario: Non-subfaction
- **WHEN** the app resolves the parent for `grey-knights` or any non-SM faction
- **THEN** the result SHALL be `undefined` (no parent)

### Requirement: Inherited Unit Status

When resolving unit statuses for a subfaction, the app SHALL first check the subfaction's own `unit_data` records and then fall back to the parent faction's records for any units without a subfaction-specific record.

#### Scenario: Shared unit inherits parent status
- **WHEN** Dark Angels unit list is loaded and `intercessor-squad` has no `unit_data` under `dark-angels` but has a `CONFIRMED` record under `space-marines`
- **THEN** `intercessor-squad` SHALL show as green (CONFIRMED)

#### Scenario: Subfaction-specific unit uses own status
- **WHEN** Dark Angels unit list is loaded and `asmodai` has an `AI_PROPOSED` record under `dark-angels`
- **THEN** `asmodai` SHALL show as amber (AI_PROPOSED)

### Requirement: Inherited Data Reads

`getStructuredAbilitiesData`, `getLoadoutData`, and `getBaseData` SHALL fall back to the parent faction's records when the subfaction has no record for a given unit.

#### Scenario: Reading abilities for a shared unit
- **WHEN** `getStructuredAbilitiesData("dark-angels", "captain")` is called and no record exists under `dark-angels`
- **THEN** the function SHALL return the record from `space-marines`

#### Scenario: Reading abilities for a subfaction-specific unit
- **WHEN** `getStructuredAbilitiesData("dark-angels", "asmodai")` is called
- **THEN** the function SHALL return the record from `dark-angels` without querying the parent

### Requirement: Writes Target the Owning Faction

When saving abilities or loadout for a unit opened from a subfaction, the write SHALL target the faction slug that owns the data. For shared units (data inherited from parent), writes SHALL go to the parent faction slug.

#### Scenario: Saving a shared unit from a subfaction
- **WHEN** the user edits and saves abilities for `captain` while viewing Dark Angels
- **THEN** the `unit_data` record SHALL be written with `faction_slug: "space-marines"`

#### Scenario: Saving a subfaction-specific unit
- **WHEN** the user edits and saves abilities for `asmodai` while viewing Dark Angels
- **THEN** the `unit_data` record SHALL be written with `faction_slug: "dark-angels"`
