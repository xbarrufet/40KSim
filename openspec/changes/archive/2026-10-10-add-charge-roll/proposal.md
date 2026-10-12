# Proposal

## Why

El dropdown de tiradas del efecto `diceModifier` incluye Impactar, Herir, Salvación, Daño y Hazard, pero falta la tirada de Carga. Algunas habilidades modifican la tirada de carga (e.g. "+1 a la tirada de carga"), y actualmente no se pueden modelar.

## What Changes

- Añadir `'charge'` como valor válido del campo `roll` en `DiceModifierEffect`.
- Añadir la opción "Carga" al dropdown de tiradas en el formulario de estructuración.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `simulation-unit-data`: Añadir `'charge'` al tipo union del campo `roll` de `diceModifier`.
- `process-unit`: Añadir opción "Carga" al dropdown de tiradas.

## Impact

- `app/src/data/schema.ts`: Añadir `'charge'` al tipo `roll` en `DiceModifierEffect`.
- `app/src/home/ProcessUnitView.tsx`: Añadir `<option>` al dropdown.
- Sin migración de datos — cambio aditivo retrocompatible.
