# Design

## Context

El tipo `Phase` en `schema.ts` tiene 6 valores. El selector de fase en `ProcessUnitView.tsx` los mapea a labels en español. La lógica de simulación (aún no implementada completamente) filtra habilidades por fase. Ver proposal.md para motivación.

## Goals / Non-Goals

**Goals:**
- Añadir `ALL_COMBAT` como valor del tipo `Phase` que el simulador trate como equivalente a SHOOTING + FIGHT.
- Exponer la opción en el selector de fase del formulario de estructuración.

**Non-Goals:**
- No cambiar la semántica de los valores existentes de `Phase`.
- No migrar datos existentes — las habilidades ya guardadas mantienen su fase actual.
- No implementar lógica de simulación completa — solo asegurar que el filtrado por fase reconozca `ALL_COMBAT`.

## Decisions

### 1. Valor literal `ALL_COMBAT` en el tipo union

Se añade `'ALL_COMBAT'` al tipo `Phase` en `schema.ts`. Alternativa considerada: usar un array de fases (`phase: Phase[]`) — descartada porque requeriría migrar todos los datos existentes y cambiar la interfaz del formulario de un select a un multi-select.

### 2. Posición en el dropdown

"Todo Combate" se coloca entre "Disparo" y "Carga" en el selector, agrupando visualmente las opciones relacionadas con combate (Disparo → Todo Combate → Carga → Combate).

### 3. Matching en simulación

Cualquier código que filtre habilidades por fase debe tratar `ALL_COMBAT` como match cuando la fase activa es `SHOOTING` o `FIGHT`. Esto se resuelve con un helper `phaseMatches(abilityPhase, activePhase)` o inline donde se necesite.

## Risks / Trade-offs

- **[Datos en Supabase]** → Las habilidades existentes no se migran. Si el usuario quiere cambiar una habilidad de `SHOOTING` a `ALL_COMBAT`, debe editarla manualmente en el Process Unit. Esto es aceptable dado el volumen bajo de datos.
