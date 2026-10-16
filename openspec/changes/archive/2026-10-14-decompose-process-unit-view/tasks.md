# Tasks

## 1. Extraer funciones puras a processUnitLogic.ts

- [x] 1.1 Mover `computeBaseDataHash`, `describeEffect`, `describeHits`, `describeTargetCondition` y las constantes de labels (`FREQUENCY_LABELS`, `PHASE_SHORT_LABELS`, `EFFECT_CATEGORY_LABELS`) de `ProcessUnitView.tsx` a `processUnitLogic.ts`. Verificar: `npm run build` pasa sin errores y las funciones se importan correctamente desde el nuevo ubicación.
- [x] 1.2 Mover `formatScope` (helper de loadout) a `processUnitLogic.ts`. Verificar: build limpio.

## 2. Extraer sub-componentes existentes a ficheros propios

- [x] 2.1 Extraer `StructuringForm` (y su tipo `StructuringFormProps`) a `app/src/home/StructuringForm.tsx`. Actualizar imports en `ProcessUnitView.tsx`. Verificar: `npm run build` pasa.
- [x] 2.2 Extraer `LoadoutSection` a `app/src/home/LoadoutSection.tsx`. Verificar: build limpio.
- [x] 2.3 Extraer `TopBar` a `app/src/home/TopBar.tsx`. Verificar: build limpio.

## 3. Extraer custom hook useProcessUnitData

- [x] 3.1 Crear `app/src/home/hooks/useProcessUnitData.ts` con la lógica de carga inicial (useEffect de líneas 130-178), los estados de datos (`structuredAbilitiesData`, `draft`, `unitName`, `datasheet`, `wargear`, `weaponNames`, `keywords`, `baseDataAbilitiesMap`, `baseDataChanged`, `error`, `resolvedAbilitiesFaction`), y las funciones `resync`, `resyncNoChanges`, `save`, `validateDiceNotations`. El hook recibe `faction` y `unitSlug` y expone `setDraft` para que el structuring form lo use. Verificar: build limpio, la app carga una unidad y muestra los datos correctamente.

## 4. Extraer custom hook useStructuringForm

- [x] 4.1 Crear `app/src/home/hooks/useStructuringForm.ts` con los estados de edición (`structuringIndex`, `structuringRows`, `editingAbilityIndex`, `editingAbilityText`, `editingOtherIndex`, `editingOtherText`) y todos los handlers de estructuración (`startStructuring`, `cancelStructuring`, `commitStructuring`, `startEditing`, `commitEdit`, `startEditingOther`, `cancelEditingOther`, `saveOther`, `structureFromOther`, `markAsOther`, `markEditingAbilityAsOther`, `removeReviewedAbility`, `addStructuringRow`, `updateStructuringRow`, `addEffectToRow`, `removeEffectFromRow`, `updateEffectInRow`). El hook recibe `draft`, `setDraft` y `baseDataAbilitiesMap`. Verificar: build limpio, se puede estructurar una ability, editarla y marcarla como OTHER.

## 5. Extraer custom hook useLoadoutReview

- [x] 5.1 Crear `app/src/home/hooks/useLoadoutReview.ts` con los estados de loadout (`loadoutData`, `loadoutDecisions`, `savingLoadout`, `resolvedLoadoutFaction`) y los handlers (`setLoadoutDecision`, `saveLoadout`, `allLoadoutDecided`). El hook recibe `faction` y `unitSlug`. Verificar: build limpio, se puede aprobar/rechazar opciones de loadout y guardar.

## 6. Extraer componentes de presentación nuevos

- [x] 6.1 Crear `app/src/home/ReviewedAbilitiesTable.tsx` con la tabla de abilities revisadas (líneas 499-627 del JSX original). Recibe `draft.abilities`, los estados de edición del structuring hook, `baseDataAbilitiesMap`, `weaponNames` y los handlers correspondientes. Verificar: build limpio.
- [x] 6.2 Crear `app/src/home/RawAbilitiesList.tsx` con la lista de abilities sin revisar (líneas 629-658 del JSX original). Recibe `draft.rawAbilities`, el estado de structuring y los handlers. Verificar: build limpio.
- [x] 6.3 Crear `app/src/home/OtherAbilityEditor.tsx` con el editor inline de texto OTHER (lógica de líneas 546-564 del JSX original). Recibe `editingOtherText`, `setEditingOtherText`, y handlers `structureFromOther`, `cancelEditingOther`, `saveOther`. Verificar: build limpio.

## 7. Recomponer ProcessUnitView y verificación final

- [x] 7.1 Reducir `ProcessUnitView.tsx` al orquestador: importar los 3 hooks y los sub-componentes, componer el JSX. Eliminar todo el código ya extraído. Verificar: `npm run build` pasa, `npm run lint` limpio, `ProcessUnitView.tsx` tiene ~200 líneas o menos.
- [x] 7.2 Ejecutar los tests existentes (`npm test`) y verificar que todos pasan sin modificaciones. Verificar manualmente que la pantalla Process Unit funciona: cargar una unidad, estructurar una ability, editar, marcar como OTHER, resync, guardar abilities, aprobar/rechazar loadout, guardar loadout.

## Workflow follow-up

- Archivar el change después de verificar que el refactor está completo y los tests pasan.
