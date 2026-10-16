# Proposal

## Why

La capa de datos (`db.ts`, `supabase.ts`, `backup.ts`) tiene tres problemas que se refuerzan mutuamente: (1) el patrón parent-faction fallback se repite en 7 funciones sin abstracción compartida, (2) los tipos `FactionBackup*` y las row interfaces de Supabase usan `unknown` donde ya existen tipos de dominio, forzando 7 casts `as never` y ~25 casts `unknown`, y (3) `migrateAbility()` opera sobre datos completamente untyped con casts `as never`. Unificar ahora reduce el riesgo de bugs silenciosos en los flujos de import/export y en la resolución de subfacciones.

## What Changes

- **Crear helper genérico `withParentFallback<T>`** en `db.ts` que encapsule el patrón fetch → null? → getParentFaction → re-fetch. Refactorizar las 7 funciones que lo implementan manualmente.
- **Tipar las interfaces `FactionBackup*`** en `schema.ts`: reemplazar `unknown[]` por los tipos de dominio existentes (`UnitDataAbility[]`, `RawAbility[]`, `WargearOption[]`, `StructuredEnhancement[]`). Eliminar los `as never` en `backup.ts`.
- **Tipar las row interfaces de Supabase** (`UnitDataRow`, `LoadoutDataRow`, `DetachmentDataRow`, `FactionRow`): reemplazar `unknown[]` por los tipos de dominio. Eliminar los casts `as unknown[]` en los upserts.
- **Tipar `migrateAbility()`**: dar tipo `Record<string, unknown>` al parámetro y usar type guards en lugar de `as never` para `stat` y `keyword`.
- **Mantener `BaseData.data` y `DetachmentData.data` como `unknown`** — son blobs opacos de scraping sin schema estable. Se puede restringir a `Record<string, unknown>` pero no más.

No se modifica comportamiento visible ni se cambian APIs externas.

## Capabilities

### New Capabilities

_Ninguna — refactor interno de type safety._

### Modified Capabilities

_Ninguna — los tipos de Supabase y backup son internos, no afectan al comportamiento observable descrito en las specs._

## Impact

- **Ficheros afectados**: `app/src/data/schema.ts` (tipos backup), `app/src/data/db.ts` (helper + migrateAbility), `app/src/data/supabase.ts` (row interfaces), `app/src/data/backup.ts` (eliminar `as never`).
- **Sin cambios en**: UI, IndexedDB schema, Supabase schema, funciones de preprocessing.
- **Riesgo**: bajo — refactor de tipos con validación por `npm run build`. Los `as never` eliminados implican que errores de tipo que antes se silenciaban ahora los detectará el compilador.
