# Design

## Context

See proposal.md — Why. The current mortal wounds data model (`MortalWoundsEffect`) carries 6 fields that overlap with each other and with the ability-level phase. The form UI stacks fields vertically making review sessions slower than needed. This design covers the schema migration, the new TypeScript types, and the form restructure.

## Goals / Non-Goals

**Goals:**
- Replace `MortalWoundsEffect` with a cleaner 3-field model (hits, resolution, damagePerSuccess) + unitType
- Extend `AttackType` to cover all 40K phases (rename to `Phase` in the type)
- Compact the structuring form layout into fewer rows
- Add `heal` as a stub category

**Non-Goals:**
- Simulator changes for the new phases (MOVEMENT, CHARGE, COMMAND) — those phases are not simulated yet
- Implementing the heal effect logic
- Migrating existing IndexedDB data automatically — units with mortal wounds effects will need manual re-processing

## Decisions

### 1. Rename `AttackType` to `Phase` and extend values

**Choice**: Rename `AttackType` → `Phase` with values `'ANY' | 'MOVEMENT' | 'SHOOTING' | 'CHARGE' | 'FIGHT' | 'COMMAND'`. The field on `StructuredAbility` changes from `attackType` to `phase`.

**Why over keeping `attackType`**: The field is already labelled "Fase" in the UI. The old name was a misnomer — CHARGE and COMMAND have nothing to do with attacks. Renaming now avoids a growing mismatch between code and UI.

**Alternative considered**: Keep `attackType` and just extend the union. Rejected: increases confusion as more non-attack phases are added.

### 2. Mortal wounds 3-field model

**Choice**: Replace `amount: MortalWoundsAmount` (4 strategies), `preRoll`, `gameEvent`, `targetScope`, `range`, and `amountByKeyword` with three orthogonal fields:

```typescript
interface MortalWoundsHits =
  | { kind: 'fixed'; value: number }       // 1-10
  | { kind: 'byStat'; stat: string }        // 'models' | UnitStat
  | { kind: 'roll'; count: number; dice: 'D3' | 'D6' }  // 1-6 x D3/D6

interface MortalWoundsResolution =
  | { kind: 'always' }
  | { kind: 'roll'; threshold: number }     // 2-6, always 1D6

interface MortalWoundsDamage =
  | { kind: 'fixed'; value: number }        // 1-10
  | { kind: 'roll'; count: number; dice: 'D3' | 'D6' }  // 1-6 x D3/D6
```

**Why**: The current 4 amount strategies (`fixed`, `roll`, `perModelRoll`, `multiDiceCount`) conflate the hit count, the resolution roll, and the damage into a single field. Separating them makes the form more predictable and covers all real-world patterns found in the data (see proposal exploration).

### 3. `unitType` field on MortalWoundsEffect

**Choice**: Add `unitType: MortalWoundsUnitType` to the effect with values `'ALL' | 'VEHICLE' | 'INFANTRY' | 'MONSTER' | 'CHARACTER' | 'MOUNTED' | 'FLY' | 'WALKER' | 'TITANIC'`.

**Why over keeping `amountByKeyword`**: The keyword override system was freeform text matching against an unvalidated string. Unit type is a closed set matching 40K's own type keywords. The user creates N separate effects (one per unit type), which is clearer than nested overrides. Resolution is most-restrictive-first: `VEHICLE` takes precedence over `ALL`.

### 4. Trigger toggle instead of checkbox

**Choice**: Replace the "Aplicar siempre" checkbox + disabled input with a toggle switch. OFF = always apply (no text), ON = show trigger text input.

**Why**: The current UX has a disabled text input that confuses users — it looks like something is broken. The toggle + conditional visibility is a standard pattern.

### 5. Form layout compaction

**Choice**: Reorganise into:
- Row 1: Contexto + Fase + Trigger (toggle + text)
- Row 2: Target + Categoría
- Row N: category-specific fields

**Why**: Target and Categoría are always shown regardless of category. Putting them on the same row reduces vertical space and groups the "what kind of effect" decision together.

### 6. No automatic data migration

**Choice**: Do not write an IndexedDB migration for existing mortal wounds data. Units with mortal wounds effects will need to be re-processed manually.

**Why**: Only a handful of units (within Space Marines) have mortal wounds effects structured. Manual re-processing is faster than writing and testing a migration script. The `tag` field remains `CONFIRMED` but the form will show the old data as invalid/missing fields, prompting the user to re-edit.

**Risk**: See Risks below.

## Risks / Trade-offs

- **[Breaking change for mortal wounds data]** → Mitigated by the small number of affected units. The user will need to re-process mortal wounds abilities. No runtime crash because the form and simulator will treat unrecognised fields as missing and show defaults.
- **[`attackType` → `phase` rename is pervasive]** → Affects `schema.ts`, `ProcessUnitView.tsx`, `processUnitLogic.ts`, and any simulator code. A global find-replace with type checking catches all sites. Existing IndexedDB records use the old field name; the migration concern is the same as above — re-processing is needed.
- **[Unit type list may be incomplete]** → The current list covers the types found in Space Marines data. Other factions may have additional types (e.g. `BEAST`, `SWARM`). The `unitType` union can be extended later without schema changes to existing data.
