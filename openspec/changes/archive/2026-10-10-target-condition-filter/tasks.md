# Tasks

## 1. Modelo de datos

- [x] 1.1 Crear tipo `TargetConditionKeyword` (reutilizando valores de `MortalWoundsUnitType` sin `ALL`) y tipo `TargetCondition` con campos `keywords` y `mode` en `app/src/data/schema.ts`. Verificar: `npm run build` pasa sin errores.
- [x] 1.2 Añadir campo opcional `targetCondition?: TargetCondition` a `StatModifierEffect`, `DiceModifierEffect` y `WeaponKeywordEffect` en `schema.ts`. Verificar: `npm run build` pasa sin errores.

## 2. Formulario de estructuración — UI

- [x] 2.1 Añadir bloque "Condición objetivo" al formulario de efectos en `ProcessUnitView.tsx` para las categorías `statModifier`, `diceModifier` y `weaponKeyword`. El bloque incluye: toggle de activación (off por defecto), selector de modo (`Solo contra` / `Excepto contra`), y chips multi-select de keywords. Verificar: abrir el formulario de un efecto statModifier y confirmar que el toggle aparece y al activarlo muestra los controles.
- [x] 2.2 Conectar el estado del bloque con los datos del efecto: al activar, crear `targetCondition` en el efecto; al desactivar, eliminarlo. Verificar: activar la condición, seleccionar keywords, guardar, reabrir la unidad y confirmar que los valores persisten.
- [x] 2.3 Añadir validación en save: si `targetCondition` está activo pero no tiene keywords seleccionados, bloquear el guardado y resaltar el campo. Verificar: intentar guardar con condición activa sin keywords → save bloqueado.

## 3. Lógica de defaultEffectForCategory

- [x] 3.1 Actualizar `defaultEffectForCategory` en `ProcessUnitView.tsx` para que los efectos de `statModifier`, `diceModifier` y `weaponKeyword` no incluyan `targetCondition` por defecto (ya es así con el campo opcional, pero verificar que no se rompe nada). Verificar: crear nuevo efecto de cada categoría y confirmar que no tiene targetCondition.

## 4. Verificación final

- [x] 4.1 Ejecutar `npm run build` y `npm run lint` sin errores. Verificar: ambos comandos terminan con exit code 0.
- [x] 4.2 Probar manualmente: configurar el Apothecary Biologus — crear efecto weaponKeyword LETHAL HITS con condición "Excepto contra Vehicle", guardar, reabrir y confirmar que persiste correctamente.

## Workflow follow-up

- Archivar el change después de verificar la implementación.
