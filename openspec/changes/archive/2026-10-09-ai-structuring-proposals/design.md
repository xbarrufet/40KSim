# Design

## Context

Ver proposal.md — Why para la motivación.

El sistema de estado actual usa `UnitDataTag = 'PENDING' | 'CONFIRMED'` en `schema.ts` y `UnitStatus = 'red' | 'green'` en `db.ts`. La lista de unidades en `UnitsView.tsx` muestra `.status-light.is-red` o `.status-light.is-green`. El upload de BaseData individual usa `UploadModal.tsx`.

El script Python sigue el patrón de `data/fetch_*.py` (lee BaseData local, llama a una API externa, genera JSON de salida).

## Goals / Non-Goals

**Goals:**
- Nuevo tag `AI_PROPOSED` en el schema y en la lógica de estado.
- Script Python que genera propuestas usando Claude API.
- UI de importación de propuestas en la app (botón separado del upload de BaseData).
- Luz amber en la lista de unidades para `AI_PROPOSED`.

**Non-Goals:**
- Cambiar la luz de la lista para CONFIRMED con hash-mismatch (sigue usando solo el banner en ProcessUnit).
- Integración in-app del LLM (sin API key en el browser).
- Procesamiento de abilities sin texto de reglas (abilityType `faction` sin `rules`).

## Decisions

### Tag y UnitStatus

```typescript
// schema.ts
export type UnitDataTag = 'PENDING' | 'AI_PROPOSED' | 'CONFIRMED'

// db.ts
export type UnitStatus = 'red' | 'amber' | 'green'
// Mapping:
//   PENDING / ausente --> 'red'
//   AI_PROPOSED       --> 'amber'
//   CONFIRMED         --> 'green'
```

### Formato de salida del script

El JSON de propuestas sigue exactamente `{ [factionSlug/unitSlug]: StructuredAbilitiesData }`:

```json
{
  "space-marines/captain": {
    "tag": "AI_PROPOSED",
    "abilities": [
      {
        "type": "Always",
        "name": "Finest Hour",
        "attackType": "FIGHT",
        "trigger": "ALWAYS",
        "appliedTo": "SelfModel",
        "effects": [
          { "category": "statModifier", "target": "weapon",
            "weaponTarget": "ALL", "stat": "Attacks", "mode": "add", "value": 3 },
          { "category": "weaponKeyword", "weaponTarget": "ALL",
            "keyword": "DEVASTATING WOUNDS", "value": null }
        ]
      },
      { "type": "Always", "name": "Leader",
        "category": "OTHER", "text": "Before the battle..." }
    ],
    "rawAbilities": []
  }
}
```

Las abilities no expresables en el schema (Leader, Deep Strike, etc.) salen como `OtherAbility`.

### Prompt del script

El prompt incluye:
1. El schema TypeScript completo de `Effect` y `StructuredAbility` (sin código de app).
2. 5–6 ejemplos few-shot (FNP, reroll, statModifier, weaponKeyword, OTHER).
3. Instrucción de usar `category: "OTHER"` para abilities sin efecto simulable o ambiguas.
4. Salida en JSON estricto (un `StructuredAbilitiesData` por petición).
5. Strip HTML antes de pasar el texto (`BeautifulSoup` o `re.sub`).

Se llama a la API una vez **por unidad** (todas las abilities de la unidad en un solo prompt) para minimizar llamadas y mantener contexto entre abilities relacionadas.

### UI de importación

Un nuevo botón "Importar propuestas IA" en `UnitsView` (junto al botón existente de BaseData upload). Abre un modal simple (o reutiliza `UploadModal` con un modo distinto) que:
1. Acepta un único archivo JSON.
2. Ejecuta la lógica de importación: para cada key `factionSlug/unitSlug` del JSON, lee el `StructuredAbilitiesData` actual y decide si importar (solo si tag es PENDING o ausente).
3. Muestra resumen: N importadas, M omitidas.

Dado que el flujo es distinto (un JSON con múltiples unidades vs. múltiples JSONs de BaseData), se crea un componente separado `ProposalsImportModal.tsx` en lugar de reutilizar `UploadModal`.

### ProcessUnit con AI_PROPOSED

La pantalla de proceso ya funciona: al cargar una unidad con `tag: "AI_PROPOSED"`, `abilities[]` contiene las propuestas y `rawAbilities` está vacío. El usuario ve las propuestas en "Abilidades revisadas" y usa los botones existentes (Editar, Quitar, Marcar como OTHER) para revisarlas. Al guardar, el tag pasa a `CONFIRMED`.

## Risks / Trade-offs

- **Calidad del LLM**: el prompt puede equivocarse, especialmente en abilities con condiciones complejas. El flujo de revisión humana mitiga esto — ninguna propuesta llega a CONFIRMED sin aprobación.
- **Coste de la API**: ~1 llamada por unidad. Para Space Marines (~60 unidades), ~60 llamadas. Gestionable.
- **Abilities `isPain = true`**: algunos BaseData marcan `isPain` en las abilities — un hint valioso para el prompt para generar `damageMitigation`.
- **Migrations**: la adición de `AI_PROPOSED` es retrocompatible — los registros existentes (`PENDING`/`CONFIRMED`) no cambian.
