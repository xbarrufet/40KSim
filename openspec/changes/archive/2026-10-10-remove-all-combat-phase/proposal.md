# Proposal

## Why

El valor `ALL_COMBAT` en el tipo `Phase` es redundante. Las armas solo se usan en las fases de Disparo y Combate, por lo que marcar una habilidad de arma como `ANY` ya cubre ambas fases de combate. `ALL_COMBAT` no aporta distinción útil y añade complejidad innecesaria al selector y al modelo.

## What Changes

- Eliminar `'ALL_COMBAT'` del tipo `Phase` en el modelo de datos.
- Eliminar la opción "Todo Combate" del selector de fase en el formulario de estructuración.
- Migrar cualquier dato existente que use `ALL_COMBAT` a `ANY`.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `simulation-unit-data`: Eliminar `ALL_COMBAT` como valor válido del campo `phase`.
- `process-unit`: Eliminar la opción "Todo Combate" del selector de fase.

## Impact

- `app/src/data/schema.ts`: Eliminar `'ALL_COMBAT'` del tipo `Phase`.
- `app/src/home/ProcessUnitView.tsx`: Eliminar `<option>` del selector.
- Datos en Supabase/IndexedDB: cualquier habilidad con `phase: 'ALL_COMBAT'` debe migrarse a `'ANY'` al cargar.
