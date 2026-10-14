# Proposal

## Why

El test de Battleshock es una tirada que varias habilidades pueden modificar (ej. +1/-1 al test, reroll). Actualmente el dropdown de tirada en `diceModifier` no incluye esta opción, así que no se pueden modelar habilidades que afectan al Battleshock.

## What Changes

- Añadir `'battleshock'` al tipo `roll` de `DiceModifierEffect`.
- Añadir la opción "Battleshock" al dropdown de tirada en el formulario de estructuración.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `simulation-unit-data`: `DiceModifierEffect.roll` incluye `'battleshock'`.
- `process-unit`: el dropdown de tirada incluye la opción "Battleshock".

## Impact

- **Schema**: `DiceModifierEffect.roll` en `schema.ts` gana un valor más.
- **Formulario**: una `<option>` adicional en el `<select>` de tirada en `EffectFields`.
- **Datos existentes**: retrocompatible — ningún dato existente usa `'battleshock'`.
