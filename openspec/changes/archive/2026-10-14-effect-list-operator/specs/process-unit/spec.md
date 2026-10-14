# Spec Delta

## ADDED Requirements

### Requirement: Effects Operator Selector in Structuring Form
The structuring form SHALL display an "Operador efectos" dropdown on the descriptors row (alongside Fase, Frecuencia, Trigger) when the current ability row has **2 or more effects**. The dropdown SHALL offer two options: `AND — Aplicar todos` (default) and `OR — Según condición`. When the ability has only 1 effect, the dropdown SHALL NOT be visible. The selected value SHALL be stored as `effectsOperator` on the `StructuredAbility`.

#### Scenario: Hidden when single effect
- **WHEN** the structuring form has exactly 1 effect in the current row
- **THEN** no "Operador efectos" dropdown is shown

#### Scenario: Visible when multiple effects
- **WHEN** the user adds a second effect to the current row via "+ Añadir efecto"
- **THEN** the "Operador efectos" dropdown appears on the descriptors row

#### Scenario: Default is AND
- **WHEN** the "Operador efectos" dropdown first appears
- **THEN** it defaults to `AND — Aplicar todos`

#### Scenario: Value persisted on save
- **WHEN** the user sets the operator to OR and saves the ability
- **THEN** the resulting `StructuredAbility` has `effectsOperator: 'OR'`

#### Scenario: Hidden again when effect removed
- **WHEN** the user removes effects until only 1 remains
- **THEN** the "Operador efectos" dropdown disappears and `effectsOperator` is reset to undefined
