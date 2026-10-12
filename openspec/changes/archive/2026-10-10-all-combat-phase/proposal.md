# Proposal

## Why

Algunas habilidades de Warhammer 40K se aplican tanto en la fase de Disparo como en la de Combate (por ejemplo, rerolls to hit en ambas fases). Actualmente, la única opción para cubrir ambas es `ANY`, que también incluye fases no relevantes como Movimiento o Mando. Se necesita un valor de fase específico que agrupe solo las dos fases de combate.

## What Changes

- Añadir un nuevo valor `ALL_COMBAT` al tipo `Phase` en el modelo de datos, que representa la combinación de las fases SHOOTING y FIGHT.
- Añadir la opción "Todo Combate" al selector de fase del formulario de estructuración de habilidades en ProcessUnitView.
- Actualizar la lógica del simulador para que interprete `ALL_COMBAT` como aplicable durante ambas fases de combate (SHOOTING y FIGHT).

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `simulation-unit-data`: Añadir `ALL_COMBAT` como valor válido del campo `phase` en `StructuredAbility`.
- `process-unit`: Añadir la opción "Todo Combate" al selector de fase en el formulario de estructuración.

## Impact

- `app/src/data/schema.ts`: Extender el tipo `Phase` con `'ALL_COMBAT'`.
- `app/src/home/ProcessUnitView.tsx`: Añadir `<option>` al selector de fase.
- Lógica de simulación: cualquier código que filtre habilidades por fase debe tratar `ALL_COMBAT` como match para `SHOOTING` y `FIGHT`.
- Datos existentes: no se ven afectados (no hay migración, las habilidades existentes mantienen sus valores actuales).
