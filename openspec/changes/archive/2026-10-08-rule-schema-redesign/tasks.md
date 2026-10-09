# Tasks

## 1. Nuevos tipos TypeScript en schema.ts

- [x] 1.1 Añadir `AttackType`, `StatModifierEffect`, `DiceModifierEffect`, `WeaponKeywordEffect`, `DamageMitigationEffect`, `Effect` a `schema.ts` — verificar que `npm run build` no reporta errores de tipo.
- [x] 1.2 Actualizar `StructuredAbility`: añadir `attackType: AttackType`, sustituir `rule: Rule` por `effects: Effect[]`, añadir `trigger: string` y `appliedTo` directamente en la interfaz — verificar que la interfaz compila sin errores.
- [x] 1.3 Eliminar los tipos obsoletos (`RuleBase`, `UnitStatsModifierRule`, `WeaponStatsModifierRule`, `DiceModifierRule`, `AddAttributeRule`, `Rule`) de `schema.ts` — verificar que no quedan referencias rotas en el proyecto (`npm run build` sin errores).

## 2. Migración de registros existentes en db.ts

- [x] 2.1 Añadir función `migrateStructuredAbility(ability: unknown): StructuredAbility` en `db.ts` que detecta el formato antiguo (`'rule' in ability`) y lo convierte al nuevo (`effects[]`, `attackType: 'ANY'`, `trigger` y `appliedTo` promovidos desde `rule`) — verificar con un objeto de prueba en la consola del navegador que la función produce el formato correcto.
- [x] 2.2 En `getStructuredAbilitiesData`, aplicar `migrateStructuredAbility` a cada entrada de `abilities[]` si tiene el campo `rule` en lugar de `effects` — verificar que abrir una unidad con datos del formato antiguo no lanza error y muestra sus habilidades correctamente.

## 3. processUnitLogic.ts: StructuringRow y buildStructuredAbilities

- [x] 3.1 Actualizar `StructuringRow` de `{ name, type, rule }` a `{ name, type: AbilityContext, attackType: AttackType, trigger: string, appliedTo: Rule['appliedTo'], effects: Effect[] }` — verificar que el tipo compila.
- [x] 3.2 Actualizar `buildStructuredAbilities(rows: StructuringRow[]): StructuredAbility[]` para construir el nuevo formato — verificar que devuelve objetos con `effects[]` y `attackType`.

## 4. ProcessUnitView.tsx: estado y lógica del formulario

- [x] 4.1 Añadir `defaultEffectForCategory(category: Effect['category']): Effect` que devuelve el efecto vacío por defecto para cada categoría — verificar que cada categoría produce un efecto válido según el nuevo schema.
- [x] 4.2 Actualizar `startStructuring` para inicializar una `StructuringRow` con `effects: [defaultEffectForCategory('statModifier')]`, `attackType: 'ANY'`, `trigger: 'ALWAYS'`, `appliedTo: 'SelfModel'` — verificar que el formulario se abre con los valores por defecto al pulsar "Estructurar".
- [x] 4.3 Actualizar `startEditing` para popular la `StructuringRow` desde el nuevo formato `StructuredAbility` (`effects`, `attackType`, `trigger`, `appliedTo`) — verificar que editar una habilidad existente pre-rellena el formulario correctamente.
- [x] 4.4 Actualizar `updateStructuringRow` para manejar el nuevo tipo `StructuringRow` — verificar que los cambios en los campos del formulario se reflejan en el estado.
- [x] 4.5 Actualizar `describeRule` → `describeAbility(ability: StructuredAbility): string` para el nuevo formato — verificar que la descripción en la lista de habilidades revisadas muestra la información correcta.

## 5. ProcessUnitView.tsx: rediseño de StructuringForm y EffectFields

- [x] 5.1 Rediseñar `StructuringForm`: la fila de nombre pasa a incluir también `attackType` (select), `trigger` (input) y `appliedTo` (select) — verificar que los campos se renderizan en el orden correcto.
- [x] 5.2 Añadir gestión de `effects[]` en el formulario: listar los efectos de la row actual, con un select de categoría por efecto y su botón de eliminar; un botón "Añadir efecto" añade un efecto por defecto — verificar que se pueden añadir y eliminar efectos individualmente.
- [x] 5.3 Reemplazar `RuleTypeFields` por `EffectFields({ effect, onChange })` que renderiza los campos específicos de cada categoría (`statModifier`, `diceModifier`, `weaponKeyword`, `damageMitigation`) con los nuevos selectores y labels en español — verificar que cada categoría muestra los campos correctos.
- [x] 5.4 Actualizar el select de tipo de regla en la lista de habilidades revisadas para usar el label de categoría en español en lugar del tipo de rule antiguo — verificar la coherencia visual.

## 6. Imports y limpieza

- [x] 6.1 Actualizar todos los imports en `ProcessUnitView.tsx` y `processUnitLogic.ts` para que apunten a los nuevos tipos (`Effect`, `AttackType`, etc.) y eliminar los obsoletos (`Rule`, `DiceThrow`, `RerollTarget`, etc.) — verificar que no quedan imports sin usar.

## 7. Build final

- [x] 7.1 Ejecutar `npm run build` desde `app/` y confirmar que completa sin errores TypeScript ni de lint.

## Workflow follow-up

- Archivar el change una vez confirmado el funcionamiento en el navegador.
