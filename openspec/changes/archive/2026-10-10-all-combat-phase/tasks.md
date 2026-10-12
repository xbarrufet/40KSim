# Tasks

## 1. Modelo de datos

- [x] 1.1 Añadir `'ALL_COMBAT'` al tipo `Phase` en `app/src/data/schema.ts`. Verificar: `npm run build` pasa sin errores de tipo.

## 2. Selector de fase en formulario de estructuración

- [x] 2.1 Añadir `<option value="ALL_COMBAT">Todo Combate</option>` al selector de fase en `app/src/home/ProcessUnitView.tsx`, entre "Disparo" y "Carga". Verificar: abrir el formulario de estructuración de una habilidad y confirmar que el dropdown muestra 7 opciones en el orden correcto.

## 3. Lógica de filtrado por fase

- [x] 3.1 Revisar si existe lógica de filtrado por fase en el simulador o en otros componentes que necesite reconocer `ALL_COMBAT` como match para `SHOOTING` y `FIGHT`. Actualizar donde corresponda. Verificar: si hay tests de simulación, añadir un caso para `ALL_COMBAT`; si no, verificar con `npm run build` que no hay errores.

## 4. Verificación final

- [x] 4.1 Ejecutar `npm run build` y `npm run lint` sin errores. Verificar: ambos comandos terminan con exit code 0.
- [x] 4.2 Probar manualmente en el dev server: crear/editar una habilidad, seleccionar "Todo Combate", guardar, y confirmar que el valor se persiste correctamente al reabrir la unidad.

## Workflow follow-up

- Archivar el change después de verificar la implementación.
