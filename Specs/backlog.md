# Backlog

Ordenat per prioritat. La simulació és el focus principal — detall a [specs_simulacion.md](specs_simulacion.md).

---

## 1. Simulació de combat (MVP)

→ Veure [specs_simulacion.md](specs_simulacion.md) per l'especificació completa (arquitectura, API, motor de disparo, generador de variants, UI).

---

## 2. Categorització dels triggers

**Estat actual:** `trigger` és un `string` lliure a `StructuredAbility` (`schema.ts:203`). L'únic valor especial és `'ALWAYS'`.

**Canvi:** Triggers estructurats amb categories:

| Categoria | Triggers | Paràmetres |
|-----------|----------|------------|
| Moviment | `HAS_CHARGED`, `HAS_MOVED`, `HAS_ADVANCED`, `HAS_INGRESS` | — |
| Combat | `HAS_SHOOT` | — |
| Posició | `IN_COVER`, `IN_OBJECTIVE` | — |
| Proximitat | `IN_RANGE` | distància (X) |
| Dany | `HAS_DAMAGE` | llindar de dany (X) |
| Comparació stats | `S_BIGGER_T` | — |

**Criteris d'acceptació:**
- Nou tipus `StructuredTrigger` a `schema.ts` (unió discriminada per `kind`)
- UI amb dropdown de categoria + camps de paràmetres opcionals
- Migració de triggers existents al nou format
- El simulador avalua triggers programàticament
- Mantenir `'ALWAYS'` i `'CUSTOM'` per triggers no categoritzats

**Impacte:** Canvi significatiu d'esquema — prerequisit per integrar habilitats al simulador.

---

## 3. Revisar procés de propostes AI d'estructuració d'habilitats

**Estat actual:** Pipeline AI (`archive/2026-10-09-ai-structuring-proposals/`) genera habilitats pre-estructurades. L'esquema ha canviat molt des de llavors.

**Criteris d'acceptació:**
- Actualitzar prompt/script AI per generar el format actual (`simulation-unit-data/spec.md`)
- Validar propostes contra l'esquema
- Revisar flux d'importació (`ProposalsImportModal.tsx`)
- Documentar format esperat

---

## 4. Selector Modelo/Unidad només per leaders

**Canvi:** `TARGET_SELECT` a `ProcessUnitView.tsx:819-829` mostra Modelo/Unidad/Aliado/Enemigo sempre. La distinció `SelfModel` vs `SelfUnit` només té sentit per leaders. Condicionar el selector segons `extractDatasheetContext()`.

**Criteris d'acceptació:**
- No-leader → Unidad/Aliado/Enemigo (sense Modelo)
- Leader → les quatre opcions
- Habilitats existents amb `SelfModel` en no-leaders es mapegen a `SelfUnit`

---

## 5. Eliminar exclusió d'armes (redundant amb OR entre efectes)

**Canvi:** Amb `effectsOperator: 'OR'` i `targetCondition`, l'exclusió d'armes per `WeaponTarget` és redundant.

**Criteris d'acceptació:**
- Verificar que tots els casos es cobreixen amb OR + targetCondition
- Simplificar o eliminar `WeaponSelect`
- Documentar patró recomanat

---

## 6. Revisar deuda tècnica

| Sub-item | Descripció |
|----------|-----------|
| 6a | `migrateAbility()` a `db.ts:14-57` — eliminar quan dades migrades |
| 6b | `ProcessUnitView.tsx` monolític (1176 línies) — descomposar |
| 6c | Stores IDB obsolets a `db.ts:72-79` — netejar |
| 6d | `getListByUrl` ineficient a `db.ts:101-112` — usar índex IDB |
| 6e | Noms inconsistents weapon targeting (`weaponTarget` vs `attackType`) — unificar |
| 6f | Tests obsolets `processUnitLogic.test.ts:27` — actualitzar |
