# Design

## Context

La sección "Abilidades revisadas" usa `<ul>/<li>` con `display: flex` y una función `describeAbility()` que concatena todo en un string. Ver proposal.md para motivación.

## Goals / Non-Goals

**Goals:**
- Tabla alineada con columnas fijas para los campos atómicos (nombre, fase, freq, trigger).
- Efectos como sub-filas indentadas debajo de cada habilidad.
- Mantener el formulario de edición inline (StructuringForm) cuando se activa.

**Non-Goals:**
- No hacer responsive — diseño solo para pantalla ancha.
- No cambiar la sección de habilidades sin revisar (rawAbilities).
- No cambiar la lógica de edición, solo la presentación collapsed.

## Decisions

### 1. `<table>` HTML nativa vs CSS grid

Usar `<table>` HTML nativa. Es semánticamente correcta para datos tabulares y las sub-filas de efectos se implementan con `<tr>` adicionales con `<td colSpan={5}>`. CSS grid requeriría más trabajo para las sub-filas y no añade valor aquí. El formulario de edición se renderiza en un `<tr><td colSpan={5}>` que reemplaza la fila cuando se activa.

### 2. Anchos de columna

Anchos fijos para las columnas cortas, flex para nombre:
- Nombre: `auto` (toma el espacio restante)
- Fase: `70px` (labels cortos: "Cualq.", "Disp.", etc.)
- Freq: `60px` ("1/ronda", etc.)
- Trigger: `180px` (truncado con `text-overflow: ellipsis`)
- Acciones: `120px` (dos botones)

`table-layout: fixed` con un `<colgroup>` para definir anchos.

### 3. Labels de fase abreviados

Para la columna de tabla se usan labels cortos: Cualq., Mov., Disp., Carga, Comb., Mando. Son más compactos que los del selector (que necesitan ser descriptivos). Se definen como un `Record<Phase, string>`.

### 4. Sub-filas de efectos

Cada efecto se renderiza como un `<tr className="effect-subrow">` con un `<td colSpan={5}>` que contiene un `<span>` con el label de categoría (`statMod`, `dicemod`, `wkw`, `ukw`, `dmgMit`, `MW`, `heal`) y la descripción existente de `describeEffect()`. Se reutiliza `describeEffect()` sin cambios.

### 5. Habilidades OTHER en la tabla

La fila principal muestra nombre + tag "OTHER" en la celda de fase (colSpan sobre fase+freq+trigger). La sub-fila muestra el texto formateado con `FormattedAbilityText`.

## Risks / Trade-offs

- **[Formulario inline en tabla]** → `<tr><td colSpan>` funciona bien para formularios inline. Si el formulario es muy ancho, se desbordará igual que ahora — aceptable para diseño desktop-only.
