# Proposal

## Why

Todos los estilos de la app viven en un único `App.css` (256 líneas) que mezcla estilos de topbar, factions grid, process-unit, list detail, game picker, modales, y formularios de estructuración. Además hay 59 inline `style={{}}` repartidos por los componentes (27 solo en `DetachmentDetailView`). Esto hace que cualquier cambio visual sea frágil — no hay forma de saber qué componente usa una clase sin buscar globalmente, y las colisiones de nombres son posibles.

## What Changes

- **Migrar a CSS Modules**: cada componente pasa a tener su propio `ComponentName.module.css` con estilos scoped. Vite ya soporta CSS modules out of the box (ficheros `*.module.css`).
- **Mover inline styles a clases CSS**: los 59 `style={{}}` se reemplazan por clases en los módulos CSS correspondientes.
- **Mantener `index.css` como tokens globales**: las variables CSS (`--ink`, `--paper`, etc.), resets y tipografía global se quedan en `index.css` sin cambios.
- **Reducir `App.css` a estilos del shell**: solo `.app-shell`, `.topbar`, `.brand`, `.main-nav`, `.app-footer` y media queries globales. Todo lo demás se mueve a CSS modules.
- **Reemplazar colores hardcodeados por variables CSS** donde sea posible (15+ literales como `#262e37`, `#853e2b`, `#eae9e0`).

No se modifica ningún estilo visual — la app se ve idéntica antes y después.

## Capabilities

### New Capabilities

_Ninguna — reorganización interna de CSS, misma salida visual._

### Modified Capabilities

_Ninguna — `look-and-feel` describe comportamiento visual, que no cambia._

## Impact

- **Ficheros eliminados**: `App.css` se reduce drásticamente (~50 líneas para el shell).
- **Ficheros nuevos**: ~15 ficheros `*.module.css` (uno por componente que tiene estilos).
- **Ficheros modificados**: todos los `.tsx` que usan `className="..."` pasan a `className={styles.xxx}`.
- **Sin cambios en**: lógica, datos, tests, schema.
- **Dependencia**: Vite CSS Modules ya funciona sin configuración adicional.
- **Riesgo**: medio — muchos ficheros tocados, pero cambios mecánicos. Validación visual necesaria.
