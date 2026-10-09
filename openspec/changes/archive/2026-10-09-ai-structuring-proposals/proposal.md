# Proposal

## Why

Estructurar habilidades de una unidad manualmente es un proceso lento (3–5 min por habilidad). Con el nuevo schema de `effects[]`, el formato es suficientemente regular para que un LLM proponga una primera versión con alta tasa de acierto. Un flujo de revisión en lugar de creación reduce el tiempo a ~30 seg por habilidad. El sistema ya tiene un pipeline Python para datos; un nuevo script de estructuración automática encaja de forma natural.

## What Changes

- **Nuevo tag `AI_PROPOSED`** en `UnitDataTag`: tercer estado entre `PENDING` (rojo) y `CONFIRMED` (verde). Representa propuestas de IA pendientes de revisión humana (luz amarilla).
- **Estado amber en la lista de unidades**: `UnitStatus` añade `'amber'`; `getUnitStatuses` mapea `AI_PROPOSED` → `'amber'`. El CSS añade `.is-amber`.
- **Script Python `data/auto_structure.py`**: lee BaseData de una facción, llama a Claude API por cada habilidad con texto de reglas, genera `structuring_proposals.json` indexado por `factionSlug/unitSlug`, con `StructuredAbilitiesData` completo (`tag: "AI_PROPOSED"`, `abilities[]` con efectos en el nuevo schema, `rawAbilities: []`).
- **Importar propuestas en la app**: nueva acción de importación de JSON en la UI (botón junto al Upload de BaseData). Por cada `unit-slug` del JSON, crea o sobreescribe el `StructuredAbilitiesData` solo si el estado actual es `PENDING` o ausente; **nunca sobreescribe `CONFIRMED` ni `AI_PROPOSED`**.
- El caso `CONFIRMED + baseDataChanged` sigue usando el banner en la pantalla de proceso (no cambia la luz de la lista para CONFIRMED).

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `process-unit`: nuevo tag `AI_PROPOSED`, acción de importación de propuestas IA.
- `faction-unit-browser`: la lista de unidades añade el estado amber para `AI_PROPOSED`.

## Impact

- `app/src/data/schema.ts` — `UnitDataTag` añade `'AI_PROPOSED'`.
- `app/src/data/db.ts` — `UnitStatus` añade `'amber'`; `getUnitStatuses` mapea el nuevo tag.
- `app/src/home/UnitsView.tsx` — botón de importar propuestas junto al botón de upload existente.
- `app/src/home/UploadModal.tsx` (o nuevo `ProposalsImportModal.tsx`) — lógica de importación del JSON.
- `app/src/App.css` — `.status-light.is-amber`.
- `data/auto_structure.py` — nuevo script Python (fuera del bundle de la app).
