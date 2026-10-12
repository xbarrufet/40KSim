# Spec Delta

## MODIFIED Requirements

### Requirement: Extended Phase Selector

The structuring form's phase selector (labelled "Fase") SHALL offer seven values: `Cualquiera`, `Movimiento`, `Disparo`, `Todo Combate`, `Carga`, `Combate`, `Mando`. These map to data model values `ANY`, `MOVEMENT`, `SHOOTING`, `ALL_COMBAT`, `CHARGE`, `FIGHT`, `COMMAND`.

#### Scenario: All phases available in dropdown

- **WHEN** the user opens the phase dropdown in the structuring form
- **THEN** seven options are visible: Cualquiera, Movimiento, Disparo, Todo Combate, Carga, Combate, Mando

#### Scenario: Default phase is Cualquiera

- **WHEN** a new structuring row is created
- **THEN** the phase selector defaults to Cualquiera (ANY)

#### Scenario: Todo Combate option position

- **WHEN** the user opens the phase dropdown
- **THEN** "Todo Combate" appears between "Disparo" and "Carga", grouping the combat-related options together
