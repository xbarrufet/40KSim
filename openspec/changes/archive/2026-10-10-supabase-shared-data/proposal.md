# Proposal

## Why

Los datos de unidades (factions, units, BaseData, StructuredAbilitiesData) se almacenan solo en IndexedDB. Si el usuario resetea el navegador o cambia de ordenador, pierde todo el trabajo de curación (uploads de BaseData, revisión y confirmación de abilities). Estos datos son globales — no dependen del usuario — y deberían persistir en un backend compartido.

## What Changes

- Añadir **Supabase** como backend de datos compartidos (factions, units, base_data, unit_data). Sin autenticación ni RLS por ahora — acceso público de lectura y escritura.
- Adoptar estrategia **Supabase-first**: las escrituras van a Supabase, las lecturas sirven desde IndexedDB como cache y se revalidan en background.
- **IndexedDB pasa a ser cache** para los datos compartidos. Las army lists se mantienen solo en IndexedDB (datos personales).
- Eliminar el seed estático desde `public/data/units.json` — los datos iniciales vienen de Supabase.
- Nuevo módulo `supabase.ts` con el cliente y las funciones de acceso a datos.
- Refactorizar `db.ts` para que las operaciones de lectura/escritura de datos compartidos pasen por Supabase.

## Capabilities

### New Capabilities
- `supabase-data-layer`: Capa de acceso a datos compartidos via Supabase con cache local en IndexedDB. Cubre la conexión, el schema de tablas, la estrategia de lectura (stale-while-revalidate) y escritura (Supabase-first), y la seed inicial.

### Modified Capabilities
- `faction-unit-browser`: El seed de factions ya no usa un JSON estático — los datos vienen de Supabase. El upload de BaseData y AI proposals escribe a Supabase además de (o en vez de) IndexedDB.
- `process-unit`: El guardado de StructuredAbilitiesData (tanto PENDING como CONFIRMED) escribe a Supabase como fuente de verdad.

## Impact

- **Dependencia nueva**: `@supabase/supabase-js`
- **Variables de entorno**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Código afectado**: `db.ts` (refactor mayor), nuevo `supabase.ts`, `HomeView.tsx` (upload flows), `ProcessUnitView.tsx` (save flow)
- **Infra**: Proyecto Supabase existente en `spjpvipyyvuqotfdafqj.supabase.co` — requiere crear 4 tablas.
- **Offline**: La app sigue funcionando con datos cacheados en IDB, pero necesita conexión para escribir datos compartidos.
- **`public/data/units.json`**: Se puede eliminar o mantener como fallback de emergencia.
