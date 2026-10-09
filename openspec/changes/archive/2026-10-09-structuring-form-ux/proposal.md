# Proposal

## Why

El formulario de estructuración de habilidades usa identificadores técnicos en inglés ("unitStatsModifier", "SelfModel", "adjust") que ralentizan el trabajo de revisión. Además, no existe ninguna señal cuando el BaseData de una unidad ha sido actualizado desde la última vez que se estructuraron sus reglas, obligando al usuario a recordar manualmente qué unidades necesitan revisión.

## What Changes

- **Labels en español** en los selectores del formulario de estructuración: Contexto, Tipo de regla, Aplica a, y Efecto — los valores almacenados no cambian.
- **Efecto de diceModifier aplanado**: el selector de dos pasos (kind → reroll target) se convierte en un único select con tres opciones: "Modificador datos", "Reroll 1", "Reroll All".
- **Layout 2 filas**: Fila 1 solo el nombre; Fila 2 todos los descriptores en orden: Contexto | Trigger | Aplica a | Tipo de Regla | Efecto | [campos específicos] | Valor.
- **Detección de cambios en BaseData**: se almacena un hash del BaseData al confirmar; al abrir la pantalla de proceso se compara con el BaseData actual y se muestra un aviso si difieren. **BREAKING**: añade campo `baseDataHash?: string` a `StructuredAbilitiesData`.
- **Botón "Re-sincronizar sin cambios"**: actualiza solo el hash almacenado sin tocar `abilities` ni `rawAbilities`, para casos donde el BaseData cambió en stats o textos pero las reglas siguen siendo válidas.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `process-unit`: cambian los requisitos de la pantalla de proceso (UX del formulario de estructuración, detección de cambio en BaseData, nueva acción de re-sincronización sin cambios).

## Impact

- `app/src/data/schema.ts` — añadir `baseDataHash?: string` a `StructuredAbilitiesData`.
- `app/src/home/ProcessUnitView.tsx` — rediseño completo de `StructuringForm` y `RuleTypeFields`; lógica de hash y aviso en `ProcessUnitView`.
- `app/src/data/db.ts` — sin cambios estructurales; el hash se guarda junto con `StructuredAbilitiesData` al confirmar.
- Datos existentes en IndexedDB son compatibles: `baseDataHash` es opcional, los registros antiguos sin él mostrarán el aviso la primera vez que se abra la unidad.
