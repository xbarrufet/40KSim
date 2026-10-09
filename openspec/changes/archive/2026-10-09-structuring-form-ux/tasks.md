# Tasks

## 1. Labels en español en los selectores del formulario

- [x] 1.1 En `StructuringForm`, actualizar las `<option>` del select de Contexto a "Siempre" / "Como Líder" / "Como Lone Operative" (valores internos `Always`/`AsLeader`/`Alone` sin cambio) — verificar que los valores almacenados no cambian y los labels se muestran en español.
- [x] 1.2 En `StructuringForm`, actualizar las `<option>` del select de Tipo de regla a "Stats Unidad" / "Stats Arma" / "Modificador Tirada" / "Añadir Regla" — verificar que `defaultRuleForType` sigue recibiendo los valores técnicos correctos.
- [x] 1.3 En `StructuringForm`, actualizar las `<option>` del select de Aplica a a "Modelo" / "Unidad" / "Aliado" / "Enemigo" (valores internos `SelfModel`/`SelfUnit`/`Ally`/`Enemy`) — verificar que el schema no cambia.
- [x] 1.4 En `RuleTypeFields` para `weaponStatsModifier` y `addAttribute`, actualizar las `<option>` de Arma objetivo a "Todas" / "Distancia" / "Cuerpo a Cuerpo" (valores `ALL`/`RANGE`/`MELEE`) — verificar que los valores almacenados son correctos.

## 2. Efecto diceModifier aplanado

- [x] 2.1 Reemplazar el selector de dos pasos (`kind` + `reroll target`) por un único select con opciones "Modificador datos" (`adjust`) / "Reroll 1" (`reroll:1`) / "Reroll All" (`reroll:ALL`) — verificar que seleccionar cada opción produce el `DiceModifierEffect` correcto en el draft.
- [x] 2.2 Actualizar `RuleTypeFields` para que el campo "Valor" solo se muestre cuando la opción seleccionada es "Modificador datos" — verificar que no aparece para las opciones de reroll.

## 3. Layout 2 filas

- [x] 3.1 Reestructurar el JSX de `StructuringForm` para que cada fila tenga: Fila 1 → solo el campo Nombre; Fila 2 → Contexto | Trigger | Aplica a | Tipo de Regla | Efecto (si aplica) | [campos específicos del tipo] | Valor — verificar visualmente que el orden se respeta.
- [x] 3.2 Actualizar `.structuring-row` en `App.css` para un layout horizontal en fila 2 (`display: flex; flex-wrap: wrap; gap: 8px` o similar) — verificar que los campos no se desbordan en mobile y que el nombre ocupa la fila completa.

## 4. Hash de BaseData y detección de cambio

- [x] 4.1 Añadir `baseDataHash?: string` a la interfaz `StructuredAbilitiesData` en `schema.ts` — verificar que `npm run build` pasa sin errores TypeScript.
- [x] 4.2 Añadir función `computeBaseDataHash(baseData: unknown): Promise<string>` en `ProcessUnitView.tsx` usando `crypto.subtle.digest('SHA-256', ...)` — verificar que devuelve un string hex determinista para el mismo objeto.
- [x] 4.3 En el `useEffect` de carga de `ProcessUnitView`, calcular el hash del BaseData actual y compararlo con `structuredAbilitiesData.baseDataHash`; si difieren (o no existe hash y tag es `CONFIRMED`), activar estado local `baseDataChanged: true` — verificar que el estado es `false` cuando los hashes coinciden.
- [x] 4.4 Mostrar un aviso visible en la parte superior de la pantalla cuando `baseDataChanged` es `true` (p.ej. banner con texto "El BaseData de esta unidad ha cambiado desde la última confirmación") — verificar que el aviso aparece y desaparece correctamente.
- [x] 4.5 En la función `save()`, calcular el hash del BaseData actual justo antes de llamar a `putStructuredAbilitiesData` e incluirlo en el objeto confirmado como `baseDataHash` — verificar que tras guardar el indicador de cambio desaparece al reabrir la pantalla.

## 5. Botón "Re-sincronizar sin cambios"

- [x] 5.1 Añadir botón "Re-sincronizar sin cambios" junto al botón "Re-sincronizar desde BaseData" existente — verificar que ambos botones son visibles en la pantalla.
- [x] 5.2 Implementar el handler: calcula el hash del BaseData actual, llama a `putStructuredAbilitiesData` con las mismas `abilities` y `rawAbilities` pero con el nuevo `baseDataHash`, y limpia el estado `baseDataChanged` — verificar que tras pulsarlo el indicador de cambio desaparece sin modificar ninguna ability ni rawAbility.

## 6. Verificación del build

- [x] 6.1 Ejecutar `npm run build` desde `app/` y confirmar que completa sin errores TypeScript ni de lint.

## Workflow follow-up

- Archivar el change una vez confirmado el funcionamiento.
