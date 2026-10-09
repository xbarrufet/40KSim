# Tasks

## 1. Schema y tipos

- [x] 1.1 Añadir `'AI_PROPOSED'` a `UnitDataTag` en `schema.ts` — verificar que `npm run build` no reporta errores.
- [x] 1.2 Añadir `'amber'` a `UnitStatus` en `db.ts` y actualizar `getUnitStatuses` para mapear `AI_PROPOSED` → `'amber'` — verificar que unidades con `AI_PROPOSED` devuelven `'amber'` al cargar la lista.
- [x] 1.3 Añadir `.status-light.is-amber { background: #e6a830; }` (u otro tono amber) en `App.css` — verificar visualmente que el color es distinto de rojo y verde.

## 2. UI de importación de propuestas

- [x] 2.1 Crear `app/src/home/ProposalsImportModal.tsx`: componente modal con drop/file-input para un único JSON, botón Confirmar, botón Cancelar — verificar que el modal se abre y cierra correctamente.
- [x] 2.2 Implementar la lógica de importación en `ProposalsImportModal`: parsear el JSON, iterar las keys `factionSlug/unitSlug`, para cada una leer el `StructuredAbilitiesData` actual; importar (`putStructuredAbilitiesData`) solo si tag es `PENDING` o ausente — verificar que CONFIRMED y AI_PROPOSED no se sobreescriben.
- [x] 2.3 Mostrar resumen al finalizar: "N unidades importadas, M omitidas" — verificar que el resumen es correcto tras una importación mixta.
- [x] 2.4 Añadir botón "Importar propuestas IA" en `UnitsView.tsx` (junto al botón de upload de BaseData) que abre `ProposalsImportModal` — verificar que el botón aparece y el modal se abre.
- [x] 2.5 Al cerrar `ProposalsImportModal` con éxito, refrescar el estado de la lista de unidades (llamar al mismo callback que usa `UploadModal` para recargar statuses) — verificar que las luces se actualizan sin recargar la página.

## 3. Script Python

- [x] 3.1 Crear `data/auto_structure.py` con argumento `faction_name` (ej. "Space Marines"), función para strip HTML de `rules`, y estructura base del loop de unidades — verificar que el script carga los BaseData y lista las abilities con texto.
- [x] 3.2 Implementar el prompt de Claude: sistema con el schema completo de `Effect`/`StructuredAbility`, 5+ ejemplos few-shot (FNP, reroll, statModifier, weaponKeyword, OTHER), instrucción de usar `isPain`/`isAura` como hints — verificar con una unidad de prueba que el output es JSON válido.
- [x] 3.3 Implementar la llamada a la API (una por unidad), parseo de la respuesta, y escritura del JSON de salida en `data/<faction-slug>/structuring_proposals.json` — verificar que el archivo se genera correctamente para Space Marines.
- [x] 3.4 Añadir manejo de errores: si la API falla para una unidad, escribir esa unidad como vacía (`{ tag: "AI_PROPOSED", abilities: [], rawAbilities: [] }`) y continuar — verificar que el script completa la facción aunque una unidad falle.

## 4. Build final

- [x] 4.1 Ejecutar `npm run build` desde `app/` y confirmar que completa sin errores TypeScript ni de lint.

## Workflow follow-up

- Archivar el change una vez confirmado el funcionamiento end-to-end (script + importación + lista).
