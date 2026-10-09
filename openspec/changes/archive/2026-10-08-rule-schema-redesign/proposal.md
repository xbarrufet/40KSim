# Proposal

## Why

El esquema actual de reglas (`Rule` con 4 tipos: `unitStatsModifier`, `weaponStatsModifier`, `diceModifier`, `addAttribute`) no cubre una parte significativa de las habilidades reales de 40K. Un análisis de 202 habilidades de Space Marines identificó patrones que quedan como `OTHER`: FNP (Feel No Pain), mitigación de daño, acciones de dados más ricas (reroll fallen, auto-wound) y condiciones de fase. Además, el modelo actual asigna un `rule` único por entrada en `abilities[]`, lo que obliga al usuario a hacer "fan-out" manual cuando una habilidad tiene múltiples efectos bajo la misma condición, perdiendo la agrupación semántica.

## What Changes

- **`effects[]` en lugar de `rule` único**: cada `StructuredAbility` pasa de tener un campo `rule: Rule` a un array `effects: Effect[]`. Una habilidad con varios efectos bajo el mismo trigger se modela como una sola entrada, no como múltiples entradas duplicadas.
- **Nuevo campo `attackType`** en `StructuredAbility`: `'SHOOTING' | 'FIGHT' | 'ANY'`. El simulador lo usa para filtrar qué habilidades aplican sin preguntar al jugador (auto-exclusión por fase).
- **`statModifier`** (reemplaza `unitStatsModifier` + `weaponStatsModifier`): fusiona los dos tipos, añade campo `target: 'unit' | 'weapon'` y `mode: 'add' | 'subtract' | 'setValue' | 'halve'`.
- **`diceModifier`** (enriquecido): el campo `action` reemplaza a `modifier.kind + reroll` con un enum completo: `rerollOnes | rerollFailed | rerollAll | addToRoll | subtractFromRoll | autoSuccess | ignoreModifiers`.
- **`weaponKeyword`** (renombra `addAttribute`): mismo concepto, nombre alineado con el vocabulario del proyecto.
- **`damageMitigation`** (nuevo): cubre FNP, reducción de daño, daño a la mitad y pelear al morir — categoría actualmente inexpresable que se pierde como `OTHER`.
- **BREAKING**: los registros existentes en IndexedDB con el formato antiguo se migran al cargarse (solo hay 2 unidades estructuradas, migración en tiempo de carga).

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `simulation-unit-data`: los requisitos de Rule Types, Structured Rules y Rule Target cambian sustancialmente — nuevas categorías de efecto, `effects[]` en lugar de `rule` único, campo `attackType` en la habilidad.

## Impact

- `app/src/data/schema.ts` — tipos `Rule`, `StructuredAbility`, `UnitStatsModifierRule`, `WeaponStatsModifierRule`, `DiceModifierRule`, `AddAttributeRule` reemplazados por nuevos tipos `Effect` y `StructuredAbility`.
- `app/src/home/ProcessUnitView.tsx` — `StructuringForm` y `RuleTypeFields` rediseñados para gestionar `effects[]` en lugar de una rule única; `describeRule` y `defaultRuleForType` actualizados.
- `app/src/home/processUnitLogic.ts` — `buildStructuredAbilities` y `StructuringRow` actualizados.
- `app/src/data/db.ts` — función de migración en tiempo de carga para registros con formato antiguo.
- `app/src/data/weaponKeywords.ts` — sin cambio estructural; `KnownAttribute` sigue siendo el vocabulario de `weaponKeyword`.
