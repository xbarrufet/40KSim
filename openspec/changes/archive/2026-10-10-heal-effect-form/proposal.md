# Proposal

## Why

El efecto `heal` existe en el schema (`HealEffect`) y en el dropdown del formulario de structuring como "Curar", pero es un stub: no tiene campos específicos y `describeEffect` devuelve `'Curar (stub)'`. El Apothecary (que cura 1D3+3) es el primer caso real que lo necesita.

## What Changes

- Añadir un campo `amount` (dice notation string) al `HealEffect` en el schema para indicar cuánto cura (e.g. `"1D3+3"`).
- Añadir el formulario del efecto heal en el ProcessUnitView: un campo de dice notation input (reutilizando `DiceNotationInput` existente).
- Actualizar `describeEffect` para mostrar el valor real en vez de `'Curar (stub)'`.
- La validación usa la regex de dice notation existente (`DICE_NOTATION_REGEX`).

## Capabilities

### Modified Capabilities
- `process-unit`: El formulario del efecto heal pasa de stub a funcional con campo de amount.
- `simulation-unit-data`: El `HealEffect` añade un campo `amount` para la cantidad curada.

## Impact

- **Código afectado**: `schema.ts` (HealEffect), `ProcessUnitView.tsx` (formulario + describeEffect + defaultEffect), `diceNotation.ts` (ya existente, se reutiliza).
- **Datos**: Los `HealEffect` existentes (si hay alguno guardado) no tienen `amount` — se trata como `undefined` (backward compatible).
