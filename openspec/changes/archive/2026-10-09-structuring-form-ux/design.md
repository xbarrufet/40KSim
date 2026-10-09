# Design

## Context

Ver proposal.md — Why para la motivación.

`StructuringForm` y `RuleTypeFields` están en `ProcessUnitView.tsx`. El formulario actual apila los campos verticalmente sin agrupación; los valores de los `<option>` son los identificadores técnicos de TypeScript. `StructuredAbilitiesData` (guardado en IndexedDB, store `unitData`) no tiene ningún campo que relacione el registro con el BaseData que lo originó.

## Goals / Non-Goals

**Goals:**
- Labels en español en todos los selectores del formulario de estructuración.
- Un único selector de Efecto para `diceModifier` (aplana la selección de dos pasos).
- Layout 2 filas: nombre solo en la primera; todos los selectores en la segunda.
- Hash del BaseData almacenado al confirmar; indicador visible cuando difiere del actual.
- Acción "Re-sincronizar sin cambios" que actualiza el hash sin tocar abilities.

**Non-Goals:**
- Cambiar los valores almacenados en IndexedDB (los ids de tipo permanecen en inglés).
- Migración activa de registros existentes (el campo `baseDataHash` es opcional; los registros sin él simplemente no mostrarán indicador hasta el próximo Guardar).
- Cambios en el simulador o en cómo se consumen las reglas estructuradas.

## Decisions

### Labels en español: solo display, sin cambio de schema

Los `<option value="unitStatsModifier">` conservan sus valores técnicos; solo cambia el texto visible. Esto evita cualquier migración de datos y mantiene los tipos TypeScript sin cambio.

```
<option value="unitStatsModifier">Stats Unidad</option>
<option value="weaponStatsModifier">Stats Arma</option>
<option value="diceModifier">Modificador Tirada</option>
<option value="addAttribute">Añadir Regla</option>
```

### Efecto aplanado: mapeo en el handler, no en el schema

El schema guarda `{ kind: 'reroll', reroll: '1' }` o `{ kind: 'reroll', reroll: 'ALL' }` o `{ kind: 'adjust', value: '' }`. El selector plano de UI necesita un valor string compuesto para representar las tres opciones:

```
"adjust"   <-> { kind: 'adjust', value: '' }
"reroll1"  <-> { kind: 'reroll', reroll: '1' }
"rerollAll" <-> { kind: 'reroll', reroll: 'ALL' }
```

El handler convierte al escribir y lee al inicializar. El tipo `DiceModifierEffect` del schema no cambia.

### Hash de BaseData: SHA-256 vía Web Crypto API

`crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(baseData)))` devuelve un `ArrayBuffer`; se convierte a hex string para almacenarlo. La API es asíncrona y disponible en todos los targets del proyecto (iOS Safari, Chrome).

El hash se calcula:
1. Al confirmar (`save()`): justo antes de `putStructuredAbilitiesData`, se recupera el `baseData` actual y se calcula el hash. Se añade como `baseDataHash` al objeto confirmado.
2. Al cargar la pantalla (`useEffect`): se calcula el hash del BaseData actual y se compara con `structuredAbilitiesData.baseDataHash`. Si difieren (o `baseDataHash` no existe y el tag es `CONFIRMED`), se activa `baseDataChanged: boolean` en el estado local.

"Re-sincronizar sin cambios":
- Llama a `putStructuredAbilitiesData` con el mismo `abilities` y `rawAbilities` pero con el nuevo `baseDataHash`.
- Limpia el estado `baseDataChanged`.

### Dónde vive el cálculo del hash

Se añade una función `computeBaseDataHash(baseData: unknown): Promise<string>` en `ProcessUnitView.tsx` (o en un util pequeño). No va en `db.ts` porque es lógica de presentación/comparación, no de persistencia.

### Layout 2 filas

CSS en `App.css`: `.structuring-row` pasa de flujo vertical a grid de 2 filas. La fila de descriptores usa `display: flex; flex-wrap: wrap; gap: 8px` para que los campos específicos de cada tipo (Stat, Arma objetivo, etc.) encajen naturalmente en la misma línea.

## Risks / Trade-offs

- **JSON.stringify no es determinista si el orden de claves varía**: el BaseData viene de IndexedDB tal cual fue guardado, así que el mismo objeto stringify-ado siempre produce el mismo resultado en el mismo navegador. Riesgo bajo en la práctica.
- **Coste de la primera apertura tras este deploy**: todos los registros CONFIRMED sin hash mostrarán el indicador la primera vez. El usuario puede usar "Re-sincronizar sin cambios" para resolverlo. Es un coste puntual y comprensible.
- **Tamaño del BaseData**: el JSON de una unidad típica es ~50–200 KB. SHA-256 sobre eso es imperceptible en main thread moderno.
