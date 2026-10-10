# Spec Delta

## MODIFIED Requirements

### Requirement: Compact Form Layout

The structuring form SHALL arrange its top-level fields in a compact row layout:
- **Row 1**: Fase, Frecuencia, Trigger (toggle + text)
- **Row 2**: Target, Categoría
- **Row N**: Category-specific fields

Target and Categoría SHALL always be visible on the same row regardless of the selected category. The "Contexto" dropdown is removed.

#### Scenario: Target and Category on same row

- **WHEN** the structuring form is displayed
- **THEN** the Target dropdown and Categoría dropdown appear on the same horizontal row
- **AND** this row is below the Fase/Frecuencia/Trigger row and above category-specific fields

#### Scenario: No Contexto dropdown

- **WHEN** the structuring form is displayed
- **THEN** no "Contexto" (Always/AsLeader/Alone) dropdown is shown
