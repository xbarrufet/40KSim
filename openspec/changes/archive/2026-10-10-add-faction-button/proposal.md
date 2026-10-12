# Proposal

## Why

Tras migrar los datos compartidos a Supabase, solo aparecen las facciones con datos subidos. Las 36 facciones conocidas de 40K existen en `data/factions.json` pero no están en Supabase, y no hay forma de subir los datos de una facción nueva desde la UI.

## What Changes

- **Seed de facciones**: Actualizar `seed_supabase.py` para subir las 36 facciones conocidas a Supabase (nombre, slug, categoría). Las facciones existen sin unidades.
- **Filtro en la grid**: La pantalla de facciones solo muestra facciones que tienen unidades registradas (unit_count > 0).
- **Botón "Añadir facción"**: Abre un modal donde el usuario selecciona de un dropdown una facción existente (sin unidades) y sube su `units.json`. No hay input libre de nombre — las facciones ya están definidas.
- **Upload de unidades**: Al confirmar, las unidades del JSON se registran via `syncUnitCatalog` y la facción pasa a mostrarse en la grid.

## Capabilities

### Modified Capabilities
- `faction-unit-browser`: Filtrar la grid a facciones con datos. Añadir modal para seleccionar una facción sin datos y subir su `units.json`.

## Impact

- **Código afectado**: `FactionsView.tsx` (filtro + botón + modal), `db.ts` (nueva función para obtener facciones sin unidades), `App.css` (estilos del modal).
- **Seed script**: `seed_supabase.py` ampliado para subir todas las facciones de `factions.json`.
- **Supabase**: No requiere cambios en el schema — las facciones se crean con el seed.
