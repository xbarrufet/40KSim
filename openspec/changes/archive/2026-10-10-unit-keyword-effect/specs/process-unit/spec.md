# Spec Delta

## ADDED Requirements

### Requirement: Unit Keyword Category in Structuring Form

The per-ability structuring form SHALL offer a "unitKeyword" (`Keyword Unidad`) effect category. When selected, the form SHALL expose:

- **Keyword**: dropdown with known unit keywords: `BENEFIT OF COVER`, `STEALTH`, `SCOUTS`, `DEEP STRIKE`, `LONE OPERATIVE`, `FIGHTS FIRST`.
- **Valor (opc.)**: optional text input for parameterised keywords (e.g. distance for SCOUTS).

#### Scenario: Selecting unit keyword category

- **WHEN** the user selects "Keyword Unidad" from the category dropdown
- **THEN** the form shows a keyword dropdown and an optional value text input

#### Scenario: Default unit keyword effect

- **WHEN** the user selects "Keyword Unidad" for a new effect
- **THEN** the keyword defaults to `BENEFIT OF COVER` and value is empty

#### Scenario: Unit keyword in category dropdown

- **WHEN** the user opens the category dropdown
- **THEN** "Keyword Unidad" appears alongside the existing categories (Stats, Tirada, Palabra Clave, Mitigación Daño, Heridas Mortales, Curar)
