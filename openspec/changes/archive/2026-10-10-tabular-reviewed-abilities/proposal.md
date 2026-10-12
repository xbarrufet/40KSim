# Proposal

## Why

La lista de habilidades revisadas en el Process Unit screen muestra cada habilidad como una línea de texto plano (`FASE [freq] [trigger] · efecto1, efecto2`). Cuando hay múltiples efectos, condiciones de target, o triggers largos, la línea se vuelve difícil de escanear. Un formato tabular con columnas alineadas permite localizar rápidamente la fase, frecuencia, trigger y efectos de cada habilidad.

## What Changes

- Reemplazar la `<ul className="ability-list">` de habilidades revisadas por una tabla HTML con columnas: Nombre, Fase, Freq, Trigger, Acciones.
- Mostrar los efectos de cada habilidad como sub-filas indentadas debajo de su fila principal (colspan sobre todas las columnas).
- Las habilidades OTHER usan la misma estructura tabular, con su texto como sub-fila.
- El formulario de edición (StructuringForm) sigue apareciendo inline cuando se activa — reemplaza la fila de la tabla temporalmente.
- Solo diseño para pantalla ancha (no responsive).

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `process-unit`: Cambiar la presentación de habilidades revisadas de lista flex a tabla con sub-filas de efectos.

## Impact

- `app/src/home/ProcessUnitView.tsx`: Reemplazar el bloque de renderizado de `draft.abilities` (líneas ~476-540).
- `app/src/App.css`: Reemplazar estilos `.ability-list` / `.ability-row` por estilos de tabla.
- No hay cambios en el modelo de datos ni en la lógica de negocio.
