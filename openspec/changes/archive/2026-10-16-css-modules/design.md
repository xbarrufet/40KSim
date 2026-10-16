# Design

## Context

La app tiene 256 líneas de CSS en `App.css` + 83 líneas en `index.css`. Los estilos se organizan por comentarios (`/* Faction card */`, `/* Process Unit screen */`, etc.) pero no hay scoping real. Vite soporta CSS Modules nativamente — cualquier fichero `.module.css` genera clases con hash automático.

Ver proposal.md para motivación completa.

## Goals / Non-Goals

**Goals:**
- Cada componente con estilos propios tiene un `*.module.css` colocado junto al componente.
- Eliminar todos los inline `style={{}}` moviendo esos estilos a clases CSS.
- Reemplazar colores hardcodeados por variables CSS existentes donde haya un match directo.
- `App.css` queda solo con estilos del shell (topbar, nav, footer, workspace, media queries).

**Non-Goals:**
- Rediseñar la UI o cambiar la estética.
- Completar la migración de fuentes (Barlow Condensed → Chakra Petch) — deuda separada.
- Adoptar una librería CSS (Tailwind, styled-components, etc.).
- Refactorizar la estructura de componentes.

## Decisions

### 1. Estructura de ficheros CSS Modules

Cada componente que tiene estilos propios obtiene un fichero `*.module.css` junto a él:

```
app/src/
  App.css                          ← solo shell (~50 líneas)
  App.module.css                   ← NO, el shell usa clases globales simples
  index.css                        ← sin cambios (tokens globales)
  home/
    FactionsView.module.css        ← .factionCategory, .factionGrid, .factionCard...
    UnitsView.module.css           ← .unitColumns, .unitRow, .unitRowPoints...
    ProcessUnitView.module.css     ← .processUnitActions, .resyncBtn, .section...
    ReviewedAbilitiesTable.module.css
    RawAbilitiesList.module.css
    StructuringForm.module.css     ← .structuringForm, .structuringRow, .effectRow...
    EffectEditor.module.css        ← .targetConditionBlock, .targetConditionChip...
    LoadoutSection.module.css
    DetachmentDetailView.module.css ← absorbe los 27 inline styles
    DetachmentsView.module.css
    UploadModal.module.css         ← .modalOverlay, .modalContent, .dropZone...
    ProposalsImportModal.module.css
    UnitDatasheet.module.css       ← .datasheetTable, .weaponOwnerCell...
    TopBar.module.css
    FormattedAbilityText.module.css ← .abilityKeyword
  list/
    ListView.module.css            ← .savedListsPanel, .savedListsTable...
    ListDetailView.module.css      ← .listDetailGrid, .rosterRow...
    ImportListModal.module.css
  game/
    GameView.module.css            ← .gamePickerList, .gamePickerRow...
```

**Por qué no un solo módulo por directorio**: la granularidad por componente es la convención más común en proyectos React y permite imports directos (`import styles from './Foo.module.css'`).

### 2. Nombrado de clases en modules

Las clases dentro de los módulos usan **camelCase** sin prefijo de componente:

```css
/* FactionsView.module.css */
.category { ... }      /* antes: .faction-category */
.grid { ... }          /* antes: .faction-grid */
.card { ... }          /* antes: .faction-card */
```

En los componentes:
```tsx
import styles from './FactionsView.module.css'
// ...
<div className={styles.grid}>
```

**Por qué camelCase**: los CSS modules de Vite exportan propiedades como `styles['faction-category']` para kebab-case, pero `styles.category` es más ergonómico. El hash de Vite evita colisiones.

### 3. Clases compartidas que se mantienen globales

Algunas clases se usan en múltiples componentes no relacionados y no tiene sentido duplicar:
- `.board-alert`, `.board-success` — banners de alerta/éxito usados en ProcessUnitView, HomeView, y potencialmente cualquier pantalla.
- `.confirm-btn` — botón de confirmación usado en modales y formularios.
- `.modal-overlay`, `.modal-content`, `.modal-header`, `.modal-actions` — estructura de modal compartida por UploadModal, ImportListModal, ProposalsImportModal.
- `.status-light` — indicador de estado usado en UnitsView, TopBar, LoadoutSection.
- `.ability-type-tag` — tag de tipo de habilidad usado en ReviewedAbilitiesTable y RawAbilitiesList.

Estas se mueven a un fichero `shared.css` (global, no module) que se importa desde `main.tsx` junto a `index.css`.

### 4. Mapeo de colores hardcodeados a variables

| Literal | Variable CSS | Uso |
|---------|-------------|-----|
| `#262e37` | `var(--panel)` | Ya definida, es el mismo valor |
| `#853e2b` | `var(--rust)` o nueva `--alert-text` | Color de texto en alertas |
| `#f8e9df` | nueva `--alert-bg` | Fondo de alertas |
| `#eae9e0` | `var(--line)` | Bordes en contextos claros — evaluar si es el mismo concepto |
| `#6a9a3a` | nueva `--success` | Verde de éxito |
| `#fff3cd` | nueva `--warning-bg` | Fondo de warning |
| `#74776b` | `var(--muted)` | Similar pero no idéntico — mantener literal |

Solo se crean variables nuevas para colores que se repiten en 2+ lugares. Los que aparecen una sola vez se dejan como literal.

### 5. Estrategia de migración

Migración componente a componente en orden de independencia (los que no dependen de otros primero):

1. Crear `shared.css` con clases globales compartidas, importar desde `main.tsx`
2. Migrar componentes hoja (GameView, TopBar, OtherAbilityEditor, FormattedAbilityText)
3. Migrar componentes de features (FactionsView, UnitsView, DetachmentsView, DetachmentDetailView)
4. Migrar componentes complejos (ProcessUnitView tree, ListView tree, UploadModal)
5. Reducir App.css al shell
6. Eliminar inline styles en cada paso

En cada paso: `npm run build` para validar.

## Risks / Trade-offs

- **Muchos ficheros tocados** → ~30 ficheros entre `.module.css` nuevos y `.tsx` modificados. Mitigación: cada componente se migra y verifica independientemente.
- **Clases compartidas duplicadas** → Si una clase se usa en 2 componentes, podría acabar definida en ambos módulos. Mitigación: `shared.css` global para las clases verdaderamente compartidas.
- **Verificación visual manual** → Los tests no cubren apariencia. Mitigación: verificar en el dev server después de cada grupo de componentes.
