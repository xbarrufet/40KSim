# Tasks

## 1. Modelo de datos

- [x] 1.1 Eliminar `'ALL_COMBAT'` del tipo `Phase` en `app/src/data/schema.ts`. Verificar: `npm run build` pasa sin errores de tipo.

## 2. Selector de fase

- [x] 2.1 Eliminar `<option value="ALL_COMBAT">Todo Combate</option>` del selector de fase en `app/src/home/ProcessUnitView.tsx`. Verificar: el dropdown muestra 6 opciones.

## 3. Migración de datos existentes

- [x] 3.1 Añadir lógica de migración en la carga de StructuredAbilitiesData: si una habilidad tiene `phase: 'ALL_COMBAT'`, reemplazar por `'ANY'`. Verificar: buscar en `db.ts` o donde se carguen los datos y añadir el mapeo.

## 4. Verificación final

- [x] 4.1 Ejecutar `npm run build` y `npm run lint` sin errores. Verificar: ambos comandos terminan con exit code 0.

## Workflow follow-up

- Archivar el change después de verificar la implementación.
