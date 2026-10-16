# Design

## Context

`ProcessUnitView.tsx` (907 líneas) es un componente monolítico que gestiona tres dominios independientes: carga/sincronización de datos, formulario de estructuración de abilities, y revisión de loadout. Los 23 `useState` hooks y ~15 handlers viven todos en el scope del componente principal. Ya existen dos sub-componentes (`LoadoutSection`, `TopBar`, `StructuringForm`) definidos en el mismo fichero, y lógica pura extraída en `processUnitLogic.ts` — el patrón de extracción ya está establecido.

Ver proposal.md para la motivación completa.

## Goals / Non-Goals

**Goals:**
- Reducir `ProcessUnitView` a ~200 líneas: orquestación de hooks + composición de sub-componentes.
- Cada hook y sub-componente extraído tiene una responsabilidad clara y testeable de forma independiente.
- Mantener el tree de ficheros plano dentro de `home/`, excepto `hooks/` para los custom hooks.

**Non-Goals:**
- Cambiar comportamiento visible (UI, flujo de datos, persistencia).
- Refactorizar CSS (los estilos inline se mantienen tal cual; es deuda separada).
- Añadir tests nuevos (los existentes cubren la lógica pura; los hooks se verifican con build + manual).
- Modificar `EffectEditor.tsx` u otros componentes fuera de `ProcessUnitView.tsx`.

## Decisions

### 1. Tres custom hooks por dominio

```
useProcessUnitData(faction, unitSlug)
  → { structuredAbilitiesData, draft, setDraft, unitName, datasheet,
      wargear, weaponNames, keywords, baseDataAbilitiesMap,
      baseDataChanged, error, resync, resyncNoChanges,
      resolvedAbilitiesFaction, save, saving, validationError }

useStructuringForm(draft, setDraft, baseDataAbilitiesMap)
  → { structuringIndex, structuringRows, editingAbilityIndex,
      editingAbilityText, editingOtherIndex, editingOtherText,
      startStructuring, cancelStructuring, commitStructuring,
      startEditing, commitEdit, startEditingOther, cancelEditingOther,
      saveOther, structureFromOther, markAsOther, markEditingAbilityAsOther,
      removeReviewedAbility, addStructuringRow, updateStructuringRow,
      addEffectToRow, removeEffectFromRow, updateEffectInRow }

useLoadoutReview(faction, unitSlug)
  → { loadoutData, loadoutDecisions, setLoadoutDecision,
      allLoadoutDecided, saveLoadout, savingLoadout,
      resolvedLoadoutFaction }
```

**Por qué hooks y no componentes con estado propio**: los tres dominios comparten `draft` (el structuring form modifica el draft que el data hook carga y guarda). Hooks permiten compartir estado sin prop drilling adicional ni context. `useLoadoutReview` es independiente y podría ir en su propio componente, pero mantenerlo como hook es consistente con los otros dos.

**Alternativa descartada**: usar React Context para `draft` — añade complejidad innecesaria dado que todo vive en un solo árbol de componentes sin niveles profundos.

### 2. Sub-componentes de presentación

| Componente | Responsabilidad | Props principales |
|---|---|---|
| `ReviewedAbilitiesTable` | Tabla de abilities revisadas + sub-rows | draft.abilities, editing state, handlers |
| `RawAbilitiesList` | Lista de abilities pendientes + structuring inline | draft.rawAbilities, structuring state, handlers |
| `OtherAbilityEditor` | Editor inline de texto OTHER | editingOtherText, handlers |
| `LoadoutSection` (ya existe) | Sección de opciones de loadout | loadoutData, decisions, handlers |
| `StructuringForm` (ya existe) | Formulario de estructuración de efectos | rows, weaponNames, handlers |
| `TopBar` (ya existe) | Barra superior con back + nombre + tag | name, onBack, tag |

**Criterio de extracción**: cada sub-componente recibe datos y callbacks por props, no accede a hooks directamente. Son componentes de presentación puros.

### 3. Funciones puras a processUnitLogic.ts

`describeEffect`, `describeHits`, `describeTargetCondition`, `computeBaseDataHash` — son funciones puras sin dependencia de React. Moverlas a `processUnitLogic.ts` las hace testeables unitariamente y reduce las líneas del fichero principal.

Las constantes de labels (`FREQUENCY_LABELS`, `PHASE_SHORT_LABELS`, `EFFECT_CATEGORY_LABELS`) se mueven junto a las funciones `describe*` que las usan.

### 4. Estructura de ficheros

```
app/src/home/
  ProcessUnitView.tsx          ← orquestador (~200 líneas)
  ReviewedAbilitiesTable.tsx   ← nuevo
  RawAbilitiesList.tsx         ← nuevo
  OtherAbilityEditor.tsx       ← nuevo
  LoadoutSection.tsx           ← extraído del mismo fichero
  StructuringForm.tsx          ← extraído del mismo fichero
  TopBar.tsx                   ← extraído (muy pequeño, podría quedarse inline)
  processUnitLogic.ts          ← ampliado con describe* y hash
  hooks/
    useProcessUnitData.ts      ← nuevo
    useStructuringForm.ts      ← nuevo
    useLoadoutReview.ts        ← nuevo
```

**Por qué `hooks/` en subdirectorio**: separar hooks de componentes evita confusión sobre qué es importable como componente React. Es una convención común en proyectos React.

**Por qué TopBar en su propio fichero**: aunque solo tiene 10 líneas, sacarlo es consistente con la extracción de LoadoutSection y StructuringForm. Si se prefiere, puede quedarse inline en ProcessUnitView.

## Risks / Trade-offs

- **Más ficheros, más imports** → El trade-off es deliberado: ficheros más pequeños y focalizados a cambio de más navegación. El proyecto ya tiene ~20 ficheros en `src/`, subir a ~30 es manejable.
- **Props drilling entre hooks y componentes** → Los sub-componentes de presentación reciben bastantes props. Esto es aceptable porque el árbol es poco profundo (1 nivel) y las interfaces tipadas documentan el contrato.
- **`TopBar` puede parecer over-extracted** → Si resulta innecesario como fichero separado, se puede dejar inline en la tarea de implementación.
