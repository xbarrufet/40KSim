# Spec Delta

## MODIFIED Requirements

### Requirement: Damage Roll in Dice Modifier Form

The dice modifier effect's roll dropdown SHALL include "Daño", "Hazard", and "Carga" options mapping to `'damage'`, `'hazard'`, and `'charge'`, alongside the existing "Impactar", "Herir", and "Salvación" options.

#### Scenario: All roll options in dropdown

- **WHEN** the user opens the roll dropdown for a dice modifier effect
- **THEN** six options are visible: Impactar, Herir, Salvación, Daño, Hazard, Carga

#### Scenario: Structuring a reroll damage ability

- **WHEN** the user structures "re-roll damage rolls" for ranged attacks
- **THEN** the user selects roll=Daño, action=Reroll todos, arma=Distancia

#### Scenario: Structuring a hazard roll modifier

- **WHEN** the user structures an ability that modifies the hazard (overcharge) roll
- **THEN** the user selects roll=Hazard and the appropriate action

#### Scenario: Structuring a charge roll modifier

- **WHEN** the user structures an ability that adds +1 to the charge roll
- **THEN** the user selects roll=Carga, action=+1 a la tirada
