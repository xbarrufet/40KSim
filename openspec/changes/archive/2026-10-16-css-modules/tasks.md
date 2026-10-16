# Tasks

## 1. Preparación: shared.css y variables CSS

- [x] 1.1 Crear `app/src/shared.css` con las clases globales compartidas: `.board-alert`, `.board-success`, `.confirm-btn`, `.modal-overlay`, `.modal-content`, `.modal-header`, `.modal-close`, `.modal-body`, `.modal-actions`, `.status-light` (y variantes `.is-red`, `.is-amber`, `.is-green`), `.ability-type-tag`, `.heading-action`, `.form-label`. Importar `shared.css` desde `main.tsx`. Verificar: `npm run build` pasa, la app se ve igual.
- [x] 1.2 Añadir variables CSS nuevas a `index.css` para colores hardcodeados repetidos: `--alert-text`, `--alert-bg`, `--success`, `--warning-bg`. Verificar: build limpio.

## 2. Migrar componentes hoja

- [x] 2.1 Crear `TopBar.module.css`, `OtherAbilityEditor.module.css`, `FormattedAbilityText.module.css` y `GameView.module.css`. Mover los estilos correspondientes de `App.css` a cada módulo. Actualizar los imports y `className` en cada componente. Eliminar inline styles si los hay. Verificar: build limpio, dev server muestra los componentes correctamente.

## 3. Migrar componentes de features (home)

- [x] 3.1 Crear `FactionsView.module.css` con los estilos de faction grid/cards (`.faction-category`, `.faction-grid`, `.faction-card`, `.faction-icon`, `.faction-name`, `.faction-counts`, `.faction-subtabs`). Actualizar `FactionsView.tsx`. Verificar: build limpio.
- [x] 3.2 Crear `UnitsView.module.css` con los estilos de la lista de unidades (`.unit-board-topbar`, `.unit-columns`, `.unit-row`, `.unit-row-points`, `.back-link`, `.upload-btn`). Actualizar `UnitsView.tsx`. Verificar: build limpio.
- [x] 3.3 Crear `DetachmentsView.module.css` y `DetachmentDetailView.module.css`. Mover estilos correspondientes y **eliminar los 27 inline styles** de DetachmentDetailView reemplazándolos por clases CSS. Actualizar ambos componentes. Verificar: build limpio, las páginas de detachments se ven idénticas.
- [x] 3.4 Crear `ArmyRulesView.module.css`. Mover los inline styles (5) a clases CSS. Verificar: build limpio.

## 4. Migrar componentes del Process Unit tree

- [x] 4.1 Crear `ProcessUnitView.module.css` con los estilos de `.process-unit-actions`, `.resync-btn`, `.process-unit-section`, `.basedata-changed-banner`. Actualizar `ProcessUnitView.tsx`. Verificar: build limpio.
- [x] 4.2 Crear `ReviewedAbilitiesTable.module.css` con los estilos de `.reviewed-abilities-table` y sub-clases. Mover los 4 inline styles a clases. Actualizar componente. Verificar: build limpio.
- [x] 4.3 Crear `RawAbilitiesList.module.css` con los estilos de `.raw-ability-list`, `.raw-ability-row`, `.raw-ability-text`, `.raw-ability-actions`. Actualizar componente. Verificar: build limpio.
- [x] 4.4 Crear `StructuringForm.module.css` con todos los estilos de `.structuring-form`, `.structuring-row`, `.structuring-effect-row`, `.toggle-switch`, `.trigger-row`, etc. Mover los 3 inline styles a clases. Actualizar componente. Verificar: build limpio.
- [x] 4.5 Crear `EffectEditor.module.css` con los estilos de `.target-condition-*`, `.dice-notation-*`, `.effect-target-category-row`. Mover los 3 inline styles a clases. Actualizar componente. Verificar: build limpio.
- [x] 4.6 Crear `LoadoutSection.module.css`. Mover los 5 inline styles a clases CSS. Actualizar componente. Verificar: build limpio.
- [x] 4.7 Crear `UnitDatasheet.module.css` con los estilos de `.datasheet-table`, `.weapon-*`, `.costs-list`, `.points-tag`, `.composition-text`, `.tag-chip-row`, `.tag-chip`. Actualizar componente. Verificar: build limpio.

## 5. Migrar modales y componentes del List/Game tree

- [x] 5.1 Crear `UploadModal.module.css` con los estilos de `.drop-zone`, `.file-list`, `.file-entry`, `.file-*`. Actualizar `UploadModal.tsx`. Verificar: build limpio.
- [x] 5.2 Crear `ProposalsImportModal.module.css`. Mover los 4 inline styles a clases. Actualizar componente. Verificar: build limpio.
- [x] 5.3 Crear `ListView.module.css` con los estilos de `.saved-lists-*`, `.list-paste-*`, `.add-list-btn`, `.delete-list-btn`. Actualizar `ListView.tsx`. Verificar: build limpio.
- [x] 5.4 Crear `ListDetailView.module.css` con los estilos de `.list-detail-*`, `.roster-*`, `.entry-panel-*`. Actualizar `ListDetailView.tsx`. Verificar: build limpio.
- [x] 5.5 Crear `ImportListModal.module.css` si tiene estilos propios. Actualizar componente. Verificar: build limpio.

## 6. Reducir App.css y verificación final

- [x] 6.1 Eliminar de `App.css` todos los estilos ya migrados a CSS modules. Dejar solo: `.app-shell`, `.topbar`, `.brand*`, `.main-nav`, `.connection-state`, `.app-footer`, `.workspace`, `.page-heading`, `h1/h2/h3/p` overrides, `.home-empty`, `.placeholder-panel`, y media queries del shell. Verificar: build limpio.
- [x] 6.2 Reemplazar colores hardcodeados por las nuevas variables CSS (`--alert-text`, `--alert-bg`, `--success`, `--warning-bg`) en `shared.css` y en los modules CSS creados. Verificar: build limpio.
- [x] 6.3 Verificar que no quedan inline `style={{}}` en ningún componente (`grep -rn "style={{" app/src/`). Si quedan, moverlos a clases CSS. Verificar: cero ocurrencias.
- [x] 6.4 Ejecutar `npm run build`, `npm run lint` y `npm test`. Verificar visual en dev server: navegar por todas las pantallas (Factions, Units, Process Unit, Detachments, List, Game) y confirmar que la apariencia es idéntica.

## Workflow follow-up

- Archivar el change después de la verificación visual completa.
