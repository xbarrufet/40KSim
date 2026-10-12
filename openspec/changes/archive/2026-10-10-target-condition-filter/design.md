# Design

## Context

El modelo de efectos en `schema.ts` tiene varias categorías. Solo `mortalWounds` tiene un filtro por tipo de unidad (`unitType`), pero con semántica distinta (selecciona qué unidades reciben los mortal wounds, siempre en modo `includes`, con un valor especial `ALL`). El nuevo `targetCondition` es ortogonal: filtra la aplicación del efecto en combate según keywords del defensor, con modos `includes`/`excludes`. Ver proposal.md para motivación.

## Goals / Non-Goals

**Goals:**
- Permitir expresar condiciones por keyword enemiga en `statModifier`, `diceModifier` y `weaponKeyword`.
- Exponer un selector intuitivo en el formulario de estructuración.
- Mantener retrocompatibilidad — efectos sin `targetCondition` no cambian.

**Non-Goals:**
- No unificar con `unitType` de `mortalWounds` — tienen semántica diferente (`unitType` filtra qué unidades reciben MW; `targetCondition` filtra cuándo un efecto de combate aplica).
- No soportar condiciones compuestas (AND de múltiples keywords) — solo OR (cualquier keyword match).
- No migrar datos existentes.

## Decisions

### 1. Tipo `TargetCondition` como interfaz compartida

```typescript
interface TargetCondition {
  keywords: TargetConditionKeyword[]
  mode: 'includes' | 'excludes'
}
type TargetConditionKeyword = 'VEHICLE' | 'MONSTER' | 'INFANTRY' | 'CHARACTER' | 'MOUNTED' | 'FLY' | 'WALKER' | 'TITANIC'
```

Se añade `targetCondition?: TargetCondition` como campo opcional en `StatModifierEffect`, `DiceModifierEffect` y `WeaponKeywordEffect`. Alternativa considerada: campo a nivel de `StructuredAbility` (no de efecto) — descartada porque el caso del Terminatus Assault tiene efectos distintos con condiciones opuestas dentro de la misma habilidad.

### 2. Reutilizar vocabulario de `MortalWoundsUnitType`

Los keywords de `TargetConditionKeyword` son los mismos que `MortalWoundsUnitType` sin `ALL`. Extraer un tipo base compartido (`UnitKeywordFilter`) para evitar duplicación.

### 3. UI: toggle + modo + multi-select de chips

El selector se presenta como un bloque colapsable con toggle. Al activar, muestra un radio `Solo contra` / `Excepto contra` y chips seleccionables para los keywords. Esto sigue el patrón visual existente de los selectores de la app. Los chips funcionan como multi-select (click para toggle on/off).

### 4. No afectar `mortalWounds`, `damageMitigation`, `unitKeyword`, `heal`

- `mortalWounds` ya tiene `unitType` con lógica propia.
- `damageMitigation` tiene `condition` (vs mortal wounds / vs psychic) que es una dimensión diferente.
- `unitKeyword` y `heal` no son efectos de combate que dependan del defensor.

## Risks / Trade-offs

- **[Complejidad UI]** → El formulario de efectos ya es denso. El toggle mantiene la condición oculta por defecto, reduciendo ruido visual.
- **[Solo OR, no AND]** → "non-Monster AND non-Vehicle" se expresa como `excludes: [MONSTER, VEHICLE]` (correcto: excluye si tiene CUALQUIERA). "vs Monster OR Vehicle" se expresa como `includes: [MONSTER, VEHICLE]` (correcto: aplica si tiene CUALQUIERA). La semántica OR cubre todos los casos reales encontrados en los datos.
