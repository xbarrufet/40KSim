# Proposal

## Why

Algunas habilidades de unidad aplican efectos distintos según el arma específica, no solo según la categoría (distancia/cuerpo a cuerpo). Ejemplo: "Full-throttle Assault" del Outrider Squad da +1 hit al Thunder Hammer y +1 Damage a las "other melee weapons". El dropdown actual solo permite `ALL`, `RANGE` y `MELEE`, así que no se puede modelar este tipo de habilidad.

## What Changes

- Extender el tipo `WeaponTarget` para aceptar nombres de arma específicos además de los valores genéricos (`ALL`, `RANGE`, `MELEE`).
- Los dropdowns de arma en los efectos `statModifier`, `diceModifier` y `weaponKeyword` del formulario de estructuración mostrarán las armas concretas de la unidad (extraídas del wargear) como opciones adicionales bajo las tres genéricas.
- El simulador deberá matchear efectos por nombre de arma cuando `weaponTarget`/`attackType` sea un nombre concreto en vez de una categoría genérica.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `simulation-unit-data`: el campo `weaponTarget` en `statModifier`/`weaponKeyword` y `attackType` en `diceModifier` aceptan valores de arma específica además de los genéricos.
- `process-unit`: los dropdowns de selección de arma en el formulario de estructuración muestran las armas de la unidad como opciones adicionales.

## Impact

- **Schema**: `WeaponTarget` en `schema.ts` pasa a unión de literales + string. `DiceModifierEffect.attackType` adopta el mismo tipo extendido.
- **Formulario**: `EffectFields` en `ProcessUnitView.tsx` recibe el wargear de la unidad para poblar los dropdowns dinámicamente.
- **Simulador**: la lógica de matching de armas debe comparar por nombre cuando el valor no es `ALL`/`RANGE`/`MELEE`.
- **Datos existentes**: retrocompatible — los valores `ALL`, `RANGE`, `MELEE` siguen funcionando sin cambios.
