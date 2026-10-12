# Tasks

## 1. Constante de labels de fase

- [x] 1.1 Crear un `Record<Phase, string>` con labels abreviados (`PHASE_SHORT_LABELS`) en `ProcessUnitView.tsx`: ANY="Cualq.", MOVEMENT="Mov.", SHOOTING="Disp.", CHARGE="Carga", FIGHT="Comb.", COMMAND="Mando". Verificar: `npm run build` pasa.

## 2. Reemplazar lista por tabla

- [x] 2.1 Reemplazar el bloque `<ul className="ability-list">` de habilidades revisadas por un `<table className="reviewed-abilities-table">` con `<colgroup>` y `<thead>` (Nombre, Fase, Freq, Trigger, Acciones). Cada habilidad se renderiza como fila principal + sub-filas de efectos. Mantener el renderizado de StructuringForm y el formulario de edición OTHER como `<tr><td colSpan={5}>`. Verificar: la tabla se renderiza correctamente con header y filas.
- [x] 2.2 En la fila principal de habilidades estructuradas: nombre en primera celda, fase con `PHASE_SHORT_LABELS[ability.phase]`, frecuencia con `FREQUENCY_LABELS` o vacío, trigger (siempre/auto/texto), botones Editar+Quitar en última celda. Verificar: los datos aparecen en columnas correctas.
- [x] 2.3 Renderizar cada efecto como `<tr className="effect-subrow"><td colSpan={5}>` con label de categoría + `describeEffect()`. Verificar: los efectos aparecen indentados debajo de su habilidad.
- [x] 2.4 Renderizar habilidades OTHER: nombre en primera celda, tag "OTHER" en segunda celda (con colSpan sobre fase+freq+trigger), botones en última celda. Sub-fila con el texto formateado. Verificar: las habilidades OTHER se muestran en la tabla.
- [x] 2.5 Renderizar `originalText` como sub-fila adicional (entre la fila principal y las sub-filas de efectos) cuando está presente. Verificar: el texto original aparece debajo del nombre y antes de los efectos.

## 3. Estilos CSS

- [x] 3.1 Añadir estilos para `.reviewed-abilities-table`: `table-layout: fixed`, `width: 100%`, `border-collapse: collapse`, y estilos para `th`, `td`, `.effect-subrow`, y la fila de edición. Reemplazar los estilos `.ability-list` y `.ability-row` que ya no se usan. Verificar: la tabla se ve con el tema oscuro, bordes sutiles, y texto alineado.

## 4. Verificación final

- [x] 4.1 Ejecutar `npm run build` y `npm run lint` sin errores. Verificar: ambos comandos terminan con exit code 0.
- [x] 4.2 Probar manualmente en el dev server: abrir una unidad con habilidades revisadas y confirmar que la tabla muestra columnas alineadas, efectos como sub-filas, habilidades OTHER con tag, y que Editar/Quitar funcionan correctamente.

## Workflow follow-up

- Archivar el change después de verificar la implementación.
