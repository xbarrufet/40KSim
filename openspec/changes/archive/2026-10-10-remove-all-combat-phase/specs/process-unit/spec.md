# Spec Delta

## MODIFIED Requirements

### Requirement: Extended Phase Selector

The structuring form's phase selector (labelled "Fase") SHALL offer six values: `Cualquiera`, `Movimiento`, `Disparo`, `Carga`, `Combate`, `Mando`. These map to data model values `ANY`, `MOVEMENT`, `SHOOTING`, `CHARGE`, `FIGHT`, `COMMAND`.

#### Scenario: All phases available in dropdown

- **WHEN** the user opens the phase dropdown in the structuring form
- **THEN** six options are visible: Cualquiera, Movimiento, Disparo, Carga, Combate, Mando

#### Scenario: Default phase is Cualquiera

- **WHEN** a new structuring row is created
- **THEN** the phase selector defaults to Cualquiera (ANY)
