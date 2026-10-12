# Tasks

## 1. Schema

- [x] 1.1 Añadir campo opcional `effectsOperator?: 'AND' | 'OR'` a `StructuredAbility` en `schema.ts`. Verificar: `npm run build` pasa.

## 2. Lógica de estructuración

- [x] 2.1 Añadir campo `effectsOperator?: 'AND' | 'OR'` a `StructuringRow` en `processUnitLogic.ts`. Propagarlo en `buildStructuredAbilities`. Verificar: `npm run build` pasa.

## 3. Formulario

- [x] 3.1 En `StructuringForm` (`ProcessUnitView.tsx`), añadir un dropdown "Operador efectos" en la fila de descriptores (`structuring-row-descriptors`), visible solo cuando `row.effects.length >= 2`. Opciones: `AND — Aplicar todos` (default), `OR — Según condición`. El valor se almacena en `row.effectsOperator`. Cuando el usuario quita efectos hasta quedar 1, resetear `effectsOperator` a `undefined`. Verificar: abrir el formulario, añadir un segundo efecto, confirmar que aparece el dropdown; quitar el segundo efecto, confirmar que desaparece.
- [x] 3.2 En `startEditing` (`ProcessUnitView.tsx`), cargar `effectsOperator` desde la ability existente al inicializar `structuringRows`. Verificar: editar una ability con `effectsOperator: 'OR'` y confirmar que el dropdown muestra OR pre-seleccionado.

## 4. Verificación

- [x] 4.1 Verificar que `npm run build` y `npm run lint` pasan sin errores.
