# Tasks

## 1. Tipar interfaces de backup y row de Supabase

- [x] 1.1 En `schema.ts`, reemplazar `unknown[]` en `FactionBackupUnitData.abilities` por `UnitDataAbility[]`, `rawAbilities` por `RawAbility[]`, `FactionBackupLoadoutData.options` por `WargearOption[]`, `FactionBackupDetachmentData.enhancements` por `StructuredEnhancement[] | null`. Cambiar `FactionBackupBaseData.data`, `FactionBackupDetachmentData.data` y `DetachmentData.data` de `unknown` a `Record<string, unknown>`. Verificar: `npm run build` pasa.
- [x] 1.2 En `supabase.ts`, tipar `UnitDataRow.abilities` como `UnitDataAbility[]`, `raw_abilities` como `RawAbility[]`, `LoadoutDataRow.options` como `WargearOption[]`, `DetachmentDataRow.data` como `Record<string, unknown>`, `DetachmentDataRow.enhancements` como `StructuredEnhancement[] | null`, `FactionRow.army_rules` como `Record<string, unknown>[] | null`. Eliminar los casts `as unknown[]` en los upserts y los casts de retorno que ya no sean necesarios. Verificar: build limpio.
- [x] 1.3 En `backup.ts`, eliminar los 4 `as never[]` (líneas 109, 110, 119, 126) — los tipos ya coinciden tras 1.1. Verificar: build limpio, cero ocurrencias de `as never` en backup.ts.

## 2. Tipar migrateAbility con type guards

- [x] 2.1 Crear type guards `isUnitStat` e `isWeaponStat` reutilizables. Si `isWeaponStat` ya existe en `EffectEditor.tsx`, moverla a un lugar compartido (ej. `schema.ts`). Verificar: build limpio.
- [x] 2.2 Cambiar la signatura de `migrateAbility` en `db.ts` de `(raw: unknown)` a `(raw: Record<string, unknown>)`. Reemplazar los 3 `as never` (líneas 35, 39, 51) por type guards o casts específicos al tipo de destino (`as UnitStat`, `as KnownAttribute`). Verificar: build limpio, cero ocurrencias de `as never` en db.ts.

## 3. Crear helper withParentFallback

- [x] 3.1 Implementar `withParentFallback<T>(factionSlug, fetcher)` en `db.ts` que encapsule el patrón fetch → null? → getParentFaction → re-fetch, devolviendo `{ data: T; resolvedFaction: string } | null`. Verificar: build limpio.
- [x] 3.2 Refactorizar `getBaseData`, `hasBaseData`, `hasStructuredAbilitiesData`, `getStructuredAbilitiesData`, `getLoadoutData` para usar `withParentFallback`. Mantener las mismas firmas de retorno. Verificar: build limpio.
- [x] 3.3 Refactorizar `getUnitStatuses` para usar `withParentFallback` o un patrón similar (esta función combina resultados de padre e hijo, no simplemente fallback). Verificar: build limpio.

## 4. Verificación final

- [x] 4.1 Ejecutar `npm run build`, `npm run lint` y `npm test`. Confirmar que no hay regresiones (los 5 test failures pre-existentes se mantienen sin cambios, los 128 tests restantes pasan). Verificar que no quedan ocurrencias de `as never` en toda la capa de datos (`grep -rn "as never" app/src/data/`).

## Workflow follow-up

- Archivar el change después de verificar que el refactor está completo.
