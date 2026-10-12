# Proposal

## Why

Los efectos dentro de una `StructuredAbility` siempre se aplican todos (AND implícito). Sin embargo, hay habilidades donde los efectos son mutuamente excluyentes — el simulador debe aplicar solo uno según la condición del objetivo (ej. Haywire Mine: 2D3 MW vs Vehicle, 1D3 MW vs el resto). Actualmente no hay forma de representar esta semántica en el formulario ni en el modelo de datos.

## What Changes

- Añadir un campo opcional `effectsOperator: 'AND' | 'OR'` a `StructuredAbility`. Default: `'AND'` (comportamiento actual).
- En el formulario de estructuración, mostrar un dropdown "Operador" (AND/OR) en la fila de descriptores (junto a Fase, Frecuencia, Trigger) cuando la ability tiene **2 o más efectos**. El dropdown se oculta si solo hay 1 efecto.
- Cuando `effectsOperator` es `'OR'`, el simulador resolverá automáticamente cuál efecto aplica según las condiciones (unitType, targetCondition, etc.), sin preguntar al jugador.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `simulation-unit-data`: `StructuredAbility` soporta un campo `effectsOperator` que define si los efectos se aplican todos (AND) o solo el que matchea por condición (OR).
- `process-unit`: el formulario de estructuración muestra un selector AND/OR cuando hay 2+ efectos en la misma ability row.

## Impact

- **Schema**: `StructuredAbility` en `schema.ts` gana `effectsOperator?: 'AND' | 'OR'`.
- **Formulario**: `StructuringForm` en `ProcessUnitView.tsx` muestra el dropdown condicionalmente.
- **Datos existentes**: retrocompatible — `effectsOperator` ausente se trata como `'AND'`.
