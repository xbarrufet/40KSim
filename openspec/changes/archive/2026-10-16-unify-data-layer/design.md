# Design

## Context

La capa de datos se divide en tres ficheros: `db.ts` (332 líneas, IndexedDB + orquestación), `supabase.ts` (277 líneas, cliente Supabase), y `backup.ts` (129 líneas, import/export JSON). Las interfaces de tipos de fila de Supabase y los tipos de backup en `schema.ts` usan `unknown` para campos que ya tienen tipos de dominio definidos en el mismo fichero, forzando casts peligrosos en cada boundary.

Ver proposal.md para motivación completa.

## Goals / Non-Goals

**Goals:**
- Eliminar todos los `as never` (7 ocurrencias) y reducir los casts `unknown` a los mínimos necesarios (blobs de scraping).
- Extraer el patrón parent-faction fallback a un helper genérico reutilizable.
- Tipar `migrateAbility()` con type guards seguros.

**Non-Goals:**
- Definir tipos para los blobs opacos de BaseData y DetachmentData.data — cambian con el scraping.
- Refactorizar el flujo de silent no-op en writes de Supabase sin client — eso requiere decisiones de UX (mostrar warning, etc.).
- Cambiar el schema de Supabase o IndexedDB.
- Añadir validación runtime en backup import — es una mejora separada.

## Decisions

### 1. Helper genérico `withParentFallback<T>`

```typescript
async function withParentFallback<T>(
  factionSlug: string,
  fetcher: (slug: string) => Promise<T | null>,
): Promise<{ data: T; resolvedFaction: string } | null> {
  const direct = await fetcher(factionSlug)
  if (direct) return { data: direct, resolvedFaction: factionSlug }
  const parent = getParentFaction(factionSlug)
  if (!parent) return null
  const fallback = await fetcher(parent)
  return fallback ? { data: fallback, resolvedFaction: parent } : null
}
```

Vive en `db.ts` junto a `getParentFaction()`. Las 6 funciones de db.ts que implementan el patrón (`getBaseData`, `hasBaseData`, `hasStructuredAbilitiesData`, `getStructuredAbilitiesData`, `getLoadoutData`, y parte de `getUnitStatuses`) pasan a usar este helper. `fetchArmyRules` en `supabase.ts` mantiene su propia implementación porque su patrón es ligeramente distinto (query directa a tabla `factions`, no a una tabla de datos por unidad).

**Alternativa descartada**: mover el helper a `supabase.ts` — conceptualmente el fallback es lógica de negocio (subfacciones heredan datos del padre), no lógica de persistencia.

### 2. Tipar interfaces de backup en schema.ts

| Interface | Campo | `unknown` → tipo |
|---|---|---|
| `FactionBackupUnitData` | `abilities` | `UnitDataAbility[]` |
| `FactionBackupUnitData` | `rawAbilities` | `RawAbility[]` |
| `FactionBackupLoadoutData` | `options` | `WargearOption[]` |
| `FactionBackupDetachmentData` | `enhancements` | `StructuredEnhancement[] \| null` |
| `FactionBackupBaseData` | `data` | `Record<string, unknown>` (blob opaco) |
| `FactionBackupDetachmentData` | `data` | `Record<string, unknown>` (blob opaco) |
| `DetachmentData` | `data` | `Record<string, unknown>` (blob opaco) |

Esto elimina automáticamente los 4 `as never` en `backup.ts` — los tipos ya coinciden.

### 3. Tipar row interfaces de Supabase

| Interface | Campo | `unknown` → tipo |
|---|---|---|
| `UnitDataRow` | `abilities` | `UnitDataAbility[]` |
| `UnitDataRow` | `raw_abilities` | `RawAbility[]` |
| `LoadoutDataRow` | `options` | `WargearOption[]` |
| `DetachmentDataRow` | `data` | `Record<string, unknown>` |
| `DetachmentDataRow` | `enhancements` | `StructuredEnhancement[] \| null` |
| `FactionRow` | `army_rules` | `Record<string, unknown>[] \| null` |

Esto elimina los casts `as unknown[]` en los upserts y los casts de retorno en los fetches.

### 4. Tipar migrateAbility con type guards

Cambiar la signatura de `function migrateAbility(raw: unknown)` a `function migrateAbility(raw: Record<string, unknown>)` y usar type guards para los campos:

```typescript
function isUnitStat(s: unknown): s is UnitStat { return UNIT_STATS.has(s as string) }
function isWeaponStat(s: unknown): s is WeaponStat { return WEAPON_STATS.has(s as string) }
```

Reemplazar `rule.stat as never` por la combinación de type guard + cast específico. La función `isWeaponStat` ya existe en `EffectEditor.tsx` — moverla a un lugar compartido (`schema.ts` o un nuevo `typeGuards.ts`).

**Alternativa descartada**: eliminar `migrateAbility()` — todavía hay datos en el formato viejo en Supabase que necesitan la migración en runtime.

## Risks / Trade-offs

- **Tipos de Supabase no validados en runtime** → Las row interfaces ahora dicen que los campos son `UnitDataAbility[]` etc., pero Supabase devuelve JSON sin validación. Si el schema de Supabase diverge, los errores se manifiestan en runtime, no en compilación. Mitigación: el schema de Supabase se controla desde los scripts de seed que usan los mismos tipos.
- **`Record<string, unknown>` para blobs** → Es más seguro que `unknown` a secas (al menos garantiza que es un objeto), pero sigue permitiendo acceso a campos sin type guard. Es el compromiso correcto para datos de scraping sin schema estable.
