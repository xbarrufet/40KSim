# Design

## Context

Ver proposal.md — Why para la motivación.

El esquema actual define `Rule` como una unión de 4 interfaces TypeScript (`UnitStatsModifierRule | WeaponStatsModifierRule | DiceModifierRule | AddAttributeRule`), cada una con `RuleBase` ({`trigger`, `appliedTo`}). `StructuredAbility` tiene `rule: Rule` (singular). El simulador y el formulario están construidos sobre este modelo.

Solo hay 2 registros `StructuredAbilitiesData` en IndexedDB (ambas `CONFIRMED`). La migración al nuevo formato se puede hacer en tiempo de carga con un transformador.

## Goals / Non-Goals

**Goals:**
- Nuevo tipo `Effect` (unión de 4 categorías) que reemplaza a `Rule`.
- `StructuredAbility.effects: Effect[]` en lugar de `StructuredAbility.rule: Rule`.
- Nuevo campo `StructuredAbility.attackType: 'SHOOTING' | 'FIGHT' | 'ANY'`.
- Migración transparente de registros IndexedDB antiguos al cargar.
- Formulario de estructuración adaptado al nuevo modelo.

**Non-Goals:**
- Cambiar los valores almacenados de `appliedTo`, `trigger`, `AbilityContext` o el vocabulario de `weaponKeywords.ts`.
- Implementar el simulador (este change solo prepara los datos).
- Añadir `attacker_tags`, `range_condition` o `unit_state` al trigger (decisión aplazada).

## Decisions

### Nuevos tipos TypeScript en `schema.ts`

```typescript
export type AttackType = 'SHOOTING' | 'FIGHT' | 'ANY'

// Efecto 1: modificador de característica
export interface StatModifierEffect {
  category: 'statModifier'
  target: 'unit' | 'weapon'
  weaponTarget?: WeaponTarget       // solo cuando target === 'weapon'
  stat: UnitStat | WeaponStat
  mode: 'add' | 'subtract' | 'setValue' | 'halve'
  value?: number                    // ausente para mode === 'halve'
}

// Efecto 2: modificador de tirada
export interface DiceModifierEffect {
  category: 'diceModifier'
  roll: 'toHit' | 'toWound' | 'savingThrow'
  action: 'rerollOnes' | 'rerollFailed' | 'rerollAll' |
          'addToRoll' | 'subtractFromRoll' | 'autoSuccess' | 'ignoreModifiers'
  attackType?: 'RANGE' | 'MELEE' | 'ALL'  // scope de arma, no de fase
}

// Efecto 3: palabra clave de arma
export interface WeaponKeywordEffect {
  category: 'weaponKeyword'
  weaponTarget: WeaponTarget
  keyword: KnownAttribute
  value: string | null
}

// Efecto 4: mitigación de daño
export interface DamageMitigationEffect {
  category: 'damageMitigation'
  kind: 'fnp' | 'damageReduction' | 'damageHalved' | 'fightOnDeath'
  value?: number
  condition?: 'any' | 'vsMortalWounds' | 'vsPsychic'
}

export type Effect = StatModifierEffect | DiceModifierEffect |
                     WeaponKeywordEffect | DamageMitigationEffect

export interface StructuredAbility {
  type: AbilityContext        // sin cambio
  name: string               // sin cambio
  attackType: AttackType     // NUEVO
  trigger: string            // sin cambio (libre, o "ALWAYS")
  appliedTo: RuleBase['appliedTo']  // sin cambio
  effects: Effect[]          // reemplaza rule: Rule
}
```

Los tipos antiguos (`UnitStatsModifierRule`, etc.) se eliminan de `schema.ts`. `RuleBase` se elimina.

### Migración de registros existentes

Al cargar `StructuredAbilitiesData` desde IndexedDB, si una `ability` tiene `rule` (formato antiguo) en lugar de `effects`, se aplica `migrateAbility(ability)`:

```
unitStatsModifier  --> statModifier { target:'unit', mode:'add', value: parseFloat(rule.value) }
weaponStatsModifier --> statModifier { target:'weapon', ... }
diceModifier adjust --> diceModifier { action: 'addToRoll' | 'subtractFromRoll' }
diceModifier reroll1 --> diceModifier { action: 'rerollOnes' }
diceModifier rerollALL --> diceModifier { action: 'rerollAll' }
addAttribute --> weaponKeyword
attackType --> 'ANY' por defecto
```

La migración es **solo en memoria** al cargar; el registro en IndexedDB se actualiza al próximo `putStructuredAbilitiesData` (cuando el usuario confirme de nuevo).

### Formulario de estructuración

`StructuringForm` pasa de gestionar `rows[]` (una row = una rule) a gestionar un array de `effects[]` bajo un bloque de condición común (nombre, scope, attackType, trigger, appliedTo). La UI queda:

```
+-- Habilidad ------------------------------------------+
| Nombre  [________________]                            |
| Contexto [v] AttackType [v] Aplica a [v]              |
| Trigger  [________________]                           |
|                                                       |
| Efectos:                                              |
|  [Categoría v] [campos específicos...]  [x eliminar]  |
|  [Categoría v] [campos específicos...]  [x eliminar]  |
|  [+ Añadir efecto]                                    |
+-------------------------------------------------------+
```

`defaultEffectForCategory` reemplaza a `defaultRuleForType`. `describeEffect` reemplaza a `describeRule`.

### `processUnitLogic.ts`

`StructuringRow` cambia de `{ name, type, rule }` a `{ name, type, attackType, trigger, appliedTo, effects[] }`. `buildStructuredAbilities` acepta un array de estas rows y devuelve `StructuredAbility[]` con el nuevo formato.

## Risks / Trade-offs

- **Valor de `value` en statModifier**: el esquema actual usa `value: string` ("+1", "-1"). El nuevo usa `number`. Los registros migrados necesitan `parseFloat` — puede perder el signo si el string era "+1". La migración usará `parseFloat(value.replace('+',''))` y deducirá `mode` del signo.
- **`attackType` en registros migrados**: se asigna `'ANY'` por defecto, lo que es conservador (el simulador sigue preguntando). El usuario puede corregirlo reeditando la habilidad.
- **Fan-out histórico**: los 2 registros actuales tienen `abilities[]` con entradas separadas que eran el fan-out de una sola habilidad. La migración no intenta reagruparlas — cada entrada migrada se convierte en una `StructuredAbility` con `effects: [migratedEffect]`. El usuario puede reagruparlas manualmente si lo desea.
