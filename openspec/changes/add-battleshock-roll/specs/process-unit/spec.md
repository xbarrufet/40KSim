# Spec Delta

## MODIFIED Requirements

### Requirement: Damage Roll in Dice Modifier Form
The dice modifier effect's roll dropdown SHALL include "Daño", "Hazard", "Carga", and "Battleshock" options mapping to `'damage'`, `'hazard'`, `'charge'`, and `'battleshock'`, alongside the existing "Impactar", "Herir", and "Salvación" options.

#### Scenario: All roll options in dropdown
- **WHEN** the user opens the roll dropdown for a dice modifier effect
- **THEN** seven options are visible: Impactar, Herir, Salvación, Daño, Hazard, Carga, Battleshock
