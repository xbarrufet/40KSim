# Design

## Context

El tipo `WeaponTarget` actualmente es `'ALL' | 'RANGE' | 'MELEE'` y se usa en `statModifier.weaponTarget` y `weaponKeyword.weaponTarget`. `DiceModifierEffect.attackType` usa el mismo conjunto de valores inline. El componente `EffectFields` renderiza un `<select>` con estas tres opciones fijas y no recibe datos de wargear.

El wargear de la unidad ya se carga en `ProcessUnitView` como `WargearEntry[]` (estado `wargear`) y se pasa a `UnitDatasheet` para mostrar las tablas de armas.

## Goals / Non-Goals

**Goals:**
- Permitir seleccionar armas específicas de la unidad en los dropdowns de efecto.
- Mantener retrocompatibilidad total con datos existentes (ALL/RANGE/MELEE siguen funcionando).

**Non-Goals:**
- No se implementa lógica de exclusión ("melee excepto X"). Se modela listando cada arma individualmente.
- No se modifica el simulador en este cambio (no hay simulador aún). Solo se ajusta schema + formulario.

## Decisions

### 1. Tipo `WeaponTarget` como unión abierta

`WeaponTarget` pasa de ser un literal union cerrado a incluir `string`:

```typescript
type WeaponTarget = 'ALL' | 'RANGE' | 'MELEE' | (string & {})
```

El patrón `(string & {})` preserva el autocompletado de los tres valores conocidos en IDEs TypeScript. `DiceModifierEffect.attackType` adopta el mismo tipo.

**Alternativa descartada**: Crear un campo separado `specificWeapon?: string`. Añade complejidad al schema y al formulario sin beneficio claro, ya que un solo campo cubre ambos casos.

### 2. Dropdown con optgroups dinámicos

`EffectFields` recibe un nuevo prop `weaponNames: { name: string; type: 'ranged' | 'melee' }[]` extraído del wargear de la unidad. El dropdown de arma se renderiza así:

```
<option value="ALL">Todas</option>
<option value="RANGE">Distancia</option>
<option value="MELEE">Cuerpo a Cuerpo</option>
<optgroup label="Distancia">
  <option value="Heavy Bolt Pistol">Heavy Bolt Pistol</option>
  ...
</optgroup>
<optgroup label="Cuerpo a Cuerpo">
  <option value="Chainsword">Chainsword</option>
  ...
</optgroup>
```

Los nombres se deduplicarán (un arma compartida por varios modelos aparece una sola vez).

**Alternativa descartada**: Selector en dos pasos (primero categoría, luego arma). Más complejo y lento para el usuario habitual que sabe qué arma quiere seleccionar.

### 3. Extracción de nombres de arma

Se añade una función helper que extrae `{ name, type }[]` a partir de `WargearEntry[]`, deduplicando por nombre:

```
function getWeaponNames(wargear: WargearEntry[]): { name: string; type: 'ranged' | 'melee' }[]
```

Se calcula una vez en `ProcessUnitView` y se pasa por props a `StructuringForm` → `EffectFields`.

### 4. Propagación de props

El flujo de datos:

```
ProcessUnitView
  wargear (ya existe) → getWeaponNames() → weaponNames
    ↓
  StructuringForm (nuevo prop: weaponNames)
    ↓
  EffectFields (nuevo prop: weaponNames)
    ↓
  WeaponSelect (nuevo componente reutilizable para los 3 dropdowns)
```

Se extrae un componente `WeaponSelect` que encapsula el dropdown con optgroups para reutilizar en los tres tipos de efecto sin duplicar JSX.

## Risks / Trade-offs

- **Armas de líderes unidos**: si un líder se une a la unidad y aporta armas, esas armas no aparecerán en el dropdown porque el wargear viene solo del BaseData de la unidad. Esto se acepta: las habilidades del líder se modelan en el UnitData del propio líder.
- **Nombres de arma como identificadores**: el matching es por nombre (case-insensitive), no por ID numérico. Dos armas con el mismo nombre pero distintos perfiles (ej. Plasma Pistol Standard/Supercharge) se tratan como una sola entrada — el efecto aplica a todos los perfiles de ese arma, lo cual es correcto.
