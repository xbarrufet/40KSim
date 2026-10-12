# Proposal

## Why

Muchas habilidades de W40K condicionan sus efectos al tipo de keyword de la unidad enemiga objetivo (e.g. "Lethal Hits: non-Vehicle", "+1 AP excluding Monster/Vehicle", "reroll vs Monster/Vehicle"). Actualmente solo `mortalWounds` tiene un campo `unitType` para este filtro. Las demás categorías de efecto (`statModifier`, `diceModifier`, `weaponKeyword`) no pueden expresar esta condición, lo que impide modelar correctamente ~15% de las habilidades de Space Marines. El patrón es estándar en el diseño de W40K y será igual o más frecuente en otras facciones.

## What Changes

- Añadir un campo opcional `targetCondition` a todas las categorías de efecto de combate (`statModifier`, `diceModifier`, `weaponKeyword`), con una lista de keywords y un modo `includes`/`excludes`.
- Añadir al formulario de estructuración un selector de condición por keyword enemiga, visible en las categorías `statModifier`, `diceModifier` y `weaponKeyword`.
- El simulador debe evaluar `targetCondition` al aplicar efectos, comprobando los keywords de la unidad defendida.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `simulation-unit-data`: Añadir `targetCondition` como campo opcional en los tipos de efecto `statModifier`, `diceModifier` y `weaponKeyword`.
- `process-unit`: Añadir selector de condición por keyword enemiga en el formulario de estructuración para las categorías afectadas.

## Impact

- `app/src/data/schema.ts`: Nuevo tipo `TargetCondition` y campo opcional en `StatModifierEffect`, `DiceModifierEffect`, `WeaponKeywordEffect`.
- `app/src/home/ProcessUnitView.tsx`: Nuevo bloque de UI en el formulario de efectos para las 3 categorías.
- Lógica de simulación: cualquier código que aplique efectos debe comprobar `targetCondition` contra los keywords de la unidad defendida.
- Datos existentes: sin migración. Los efectos existentes sin `targetCondition` siguen aplicando sin filtro (retrocompatible).
