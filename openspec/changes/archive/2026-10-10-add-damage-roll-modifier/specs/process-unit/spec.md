# Spec Delta

## ADDED Requirements

### Requirement: Damage Roll in Dice Modifier Form

The dice modifier effect's roll dropdown SHALL include "Daño" and "Hazard" options mapping to `'damage'` and `'hazard'`, alongside the existing "Impactar", "Herir", and "Salvación" options.

#### Scenario: All roll options in dropdown

- **WHEN** the user opens the roll dropdown for a dice modifier effect
- **THEN** five options are visible: Impactar, Herir, Salvación, Daño, Hazard

#### Scenario: Structuring a reroll damage ability

- **WHEN** the user structures "re-roll damage rolls" for ranged attacks
- **THEN** the user selects roll=Daño, action=Reroll todos, arma=Distancia

#### Scenario: Structuring a hazard roll modifier

- **WHEN** the user structures an ability that modifies the hazard (overcharge) roll
- **THEN** the user selects roll=Hazard and the appropriate action
