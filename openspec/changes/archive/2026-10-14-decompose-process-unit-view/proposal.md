# Proposal

## Why

`ProcessUnitView.tsx` es el componente más grande del proyecto (907 líneas, 23 `useState` hooks). Mezcla carga de datos, transformación, gestión de formularios de abilities, gestión de loadout, validación y renderizado en un solo componente. Esto hace que cualquier cambio funcional (como añadir un nuevo tipo de efecto o modificar el flujo de loadout) sea frágil y costoso. Descomponer ahora reduce el coste de los próximos cambios funcionales que se planifiquen.

## What Changes

- **Extraer custom hooks** de carga y estado:
  - `useProcessUnitData`: carga inicial (abilities, baseData, loadout), resync, detección de cambios en BaseData.
  - `useStructuringForm`: estado del formulario de estructuración (rows, editing index, commit/cancel).
  - `useLoadoutReview`: estado de decisiones de loadout (approve/reject/save).
- **Extraer sub-componentes** del JSX:
  - `ReviewedAbilitiesTable`: tabla de abilities revisadas con sub-rows de efectos y texto original.
  - `RawAbilitiesList`: lista de abilities sin revisar con inline structuring form.
  - `OtherAbilityEditor`: editor inline de abilities OTHER.
- **Mover funciones puras** a `processUnitLogic.ts`:
  - `describeEffect`, `describeHits`, `describeTargetCondition` (display helpers para efectos).
  - `computeBaseDataHash` (utilidad de hash).
- **Mover `LoadoutSection`** a su propio fichero (`LoadoutSection.tsx`).
- **Eliminar `StructuringForm`** de `ProcessUnitView.tsx` — ya es un componente independiente, solo necesita su propio fichero (`StructuringForm.tsx`).

No se modifica ningún comportamiento visible. Los tests existentes (`processUnitLogic.test.ts`) siguen pasando sin cambios.

## Capabilities

### New Capabilities

_Ninguna. Es un refactor interno sin cambios de comportamiento._

### Modified Capabilities

_Ninguna. La spec `process-unit` describe el comportamiento externo, que no cambia._

## Impact

- **Ficheros afectados**: `app/src/home/ProcessUnitView.tsx` (se reduce de ~907 a ~200 líneas), `app/src/home/processUnitLogic.ts` (se amplía con funciones puras movidas).
- **Ficheros nuevos**: `app/src/home/hooks/useProcessUnitData.ts`, `app/src/home/hooks/useStructuringForm.ts`, `app/src/home/hooks/useLoadoutReview.ts`, `app/src/home/ReviewedAbilitiesTable.tsx`, `app/src/home/RawAbilitiesList.tsx`, `app/src/home/OtherAbilityEditor.tsx`, `app/src/home/LoadoutSection.tsx`, `app/src/home/StructuringForm.tsx`.
- **Sin cambios en**: schema, base de datos, API de Supabase, CSS, tests existentes.
- **Riesgo**: bajo — refactor mecánico con validación por build + tests existentes.
