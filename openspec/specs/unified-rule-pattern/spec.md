# Unified Rule Pattern Specification

## Purpose

Define a single structural pattern that applies to the three categories of game rules in Warhammer 40,000: unit **abilities**, **enhancements**, and **stratagems**. These categories share the same fundamental grammar — a timing trigger, a target, and one or more effects — but are currently structured independently. Abilities and enhancements already share the `Effect[]` schema; stratagems remain entirely text-based.

A unified pattern enables:
- **Reuse of the AI structuring pipeline** — one prompt template for all three categories
- **Reuse of the review UI** — one form component for structured effects regardless of source
- **Simulator integration** — stratagems become simulatable using the same engine as abilities
- **Consistent data model** — one `Effect` vocabulary across the entire system

### Coverage Analysis

An analysis of 1,063 rule texts across Space Marines (with children factions), Necrons, and Orks shows:

| Category | Total rules | Match known effect types | Percentage |
|---|---|---|---|
| Abilities | 280 | 242 | 86% |
| Stratagems | 469 | 412 | 88% |
| Enhancements | 314 | 283 | 90% |
| **Total** | **1,063** | **937** | **88%** |

The remaining 12% requires a text fallback (category `OTHER`). These are: random tables, faction state machines (combat doctrines, riled up), cross-unit interactions, transport rules, and deployment manipulation.

## Requirements

### Requirement: The Unified Rule Pattern

All structured game rules — abilities, enhancements, and stratagems — SHALL follow a common pattern with four dimensions:

1. **WHEN** — timing: game phase, frequency, trigger condition
2. **WHO** — the unit or model that owns or activates the rule (implicit from context)
3. **TARGET** — what the effects apply to (per-effect `appliedTo` + optional `targetCondition`)
4. **EFFECTS** — one or more impacts from the shared Effect catalogue

Each rule category adds source-specific fields on top of this common core.

#### Scenario: Common fields across all categories

- **WHEN** a structured rule exists (ability, enhancement, or stratagem)
- **THEN** it SHALL have: `name` (string), `phase` (Phase), `effects` (Effect[]), and `originalText` (string)
- **AND** it MAY have: `trigger` (string), `frequency` (Frequency), `autoApply` (boolean), `effectsOperator` ('AND' | 'OR')

#### Scenario: Source-specific fields preserved

- **WHEN** a rule is a unit ability
- **THEN** it retains `groupId`, `groupOperator` as defined in the simulation-unit-data spec
- **WHEN** a rule is an enhancement
- **THEN** it retains `eligibility`, `points`, `enhancementType`, `limit`, `conditionalEffects` as defined in the existing schema
- **WHEN** a rule is a stratagem
- **THEN** it has additional fields: `cpCost`, `turn`, `stratagemCategory`, `targetDescription`, `secondaryEffect`, `restrictionRules`

### Requirement: Shared Effect Catalogue

All three rule categories SHALL use the same `Effect` union type for their `effects[]` array. The catalogue consists of seven categories plus a text fallback:

| Category | Description | Key fields |
|---|---|---|
| `statModifier` | Modifies a characteristic | stat, mode, value, weaponTarget |
| `diceModifier` | Modifies a dice roll | roll, action, attackType |
| `weaponKeyword` | Grants a keyword to weapons | weaponTarget, keyword, value |
| `unitKeyword` | Grants a keyword to a unit | keyword, value |
| `damageMitigation` | Reduces or prevents damage | kind, value, condition |
| `mortalWounds` | Deals mortal wounds | unitType, hits, resolution, damagePerSuccess |
| `heal` | Restores lost wounds | amount |

Every effect carries its own `appliedTo` field (SelfModel, SelfUnit, Enemy, Ally) and optional `targetCondition` where applicable.

This catalogue is identical to the one defined in the simulation-unit-data spec. No new effect categories are introduced. Rules whose effects do not fit any category SHALL use the `OTHER` text fallback.

#### Scenario: Enhancement reuses ability effect types

- **WHEN** an enhancement grants [Sustained Hits 1] to melee weapons
- **THEN** its effect is `{ category: "weaponKeyword", appliedTo: "SelfUnit", weaponTarget: "MELEE", keyword: "SUSTAINED HITS", value: "1" }`
- **AND** this is the same effect shape a unit ability would use

#### Scenario: Stratagem reuses ability effect types

- **WHEN** the "Armour of Contempt" stratagem grants -1 AP to incoming attacks
- **THEN** its effect is `{ category: "statModifier", appliedTo: "Enemy", weaponTarget: "ALL", stat: "AP", mode: "subtract", value: 1 }`
- **AND** this is the same effect shape a unit ability would use

#### Scenario: Rule that cannot be structured

- **WHEN** a rule involves random tables, state machines, or cross-unit delegation
- **THEN** it SHALL be stored with `category: "OTHER"` and a `text` field
- **AND** the simulator SHALL NOT attempt to apply it automatically

### Requirement: Unified Timing Model

The timing dimension SHALL use the same fields across all three categories:

- `phase`: Phase — the game phase(s) in which the rule is relevant
- `trigger`: string — a human-readable question or "ALWAYS"
- `frequency`: Frequency — usage limits (always, perPhase, perRound, perBattle)
- `autoApply`: boolean — skip trigger question in simulation

For stratagems, the `phase` field SHALL be derived from the existing `phases[]` array. When multiple phases are listed, `phase` SHALL be set to the most relevant one, or `"ANY"` when the stratagem truly applies in multiple unrelated phases.

The stratagem's `turn` field (yourTurn, opponentsTurn, eitherPlayer) SHALL be preserved as a stratagem-specific field since it constrains when the stratagem can be used but does not appear in abilities or enhancements.

#### Scenario: Stratagem WHEN mapping

- **WHEN** a raw stratagem has `phases: ["shootingPhase", "fightPhase"]` and `whenRules: "Your opponent's Shooting phase or the Fight phase, when an enemy unit targets a friendly unit"`
- **THEN** the structured stratagem has `phase: "ANY"` (applies in multiple combat phases) and `trigger` contains the specific timing condition extracted from `whenRules`

#### Scenario: Ability trigger as ALWAYS

- **WHEN** an ability has no condition and always applies
- **THEN** `trigger` is `"ALWAYS"` and `autoApply` is `true`

### Requirement: Structured Stratagem

A structured stratagem SHALL combine the common rule fields with stratagem-specific metadata. The `StructuredStratagem` type SHALL include:

**Common fields (shared pattern):**
- `name`: string
- `phase`: Phase
- `trigger`: string — derived from `whenRules`, phrased as a question for simulator use
- `frequency`: Frequency — typically `'always'` for most stratagems (no inherent once-per-X limit beyond CP cost)
- `autoApply`: boolean — typically `false` (stratagems are player-activated)
- `effects`: Effect[]
- `effectsOperator`: 'AND' | 'OR' — optional, for conditional effect selection
- `originalText`: string — the raw `effectRules` text

**Stratagem-specific fields:**
- `cpCost`: number — command point cost (1 or 2)
- `turn`: 'yourTurn' | 'opponentsTurn' | 'eitherPlayer'
- `stratagemCategory`: 'battleTactic' | 'strategicPloy' | 'epicDeed' | 'wargear' | '' — the stratagem's tactical classification
- `targetDescription`: string — the raw `targetRules` text, preserved for display
- `secondaryEffect`: string | null — alternative/upgraded effect text
- `secondaryEffectCpCost`: number | null — additional CP cost for secondary effect
- `restrictionRules`: string | null — usage limitation text

#### Scenario: Structuring Gene-wrought Might

- **GIVEN** the raw stratagem:
  - whenRules: "Fight phase, when a friendly Adeptus Astartes unit is selected to fight"
  - targetRules: "That Adeptus Astartes unit"
  - effectRules: "Your unit's melee attacks have: [Lance]. Or: If the assault doctrine is active, [Lance] and +1 AP"
- **THEN** the structured stratagem is:
  ```json
  {
    "name": "Gene-wrought Might",
    "cpCost": 1,
    "turn": "eitherPlayer",
    "stratagemCategory": "",
    "phase": "FIGHT",
    "trigger": "ALWAYS",
    "autoApply": false,
    "frequency": "always",
    "targetDescription": "That Adeptus Astartes unit.",
    "effects": [
      {
        "category": "weaponKeyword",
        "appliedTo": "SelfUnit",
        "weaponTarget": "MELEE",
        "keyword": "LANCE",
        "value": null
      }
    ],
    "conditionalEffects": [
      {
        "condition": "assault_doctrine",
        "effects": [
          {
            "category": "weaponKeyword",
            "appliedTo": "SelfUnit",
            "weaponTarget": "MELEE",
            "keyword": "LANCE",
            "value": null
          },
          {
            "category": "statModifier",
            "appliedTo": "SelfUnit",
            "weaponTarget": "MELEE",
            "stat": "AP",
            "mode": "add",
            "value": 1
          }
        ]
      }
    ],
    "effectsOperator": "OR",
    "originalText": "Your unit's melee attacks have: [Lance]. Or: If the assault doctrine is active for your unit, [Lance] and +1 AP.",
    "secondaryEffect": null,
    "secondaryEffectCpCost": null,
    "restrictionRules": null
  }
  ```

#### Scenario: Structuring Masks of Death

- **GIVEN** the raw stratagem:
  - cpCost: 1, turn: eitherPlayer, phases: [shootingPhase, fightPhase]
  - effectRules: "Until the end of the phase, each time an attack targets your unit, subtract 1 from the Hit roll"
- **THEN** the structured stratagem has:
  - `phase: "ANY"`, `trigger: "ALWAYS"`
  - One effect: `{ category: "diceModifier", appliedTo: "Enemy", roll: "toHit", action: "subtractFromRoll" }`

#### Scenario: Structuring Impending Krunch

- **GIVEN** the raw stratagem:
  - cpCost: 1, turn: yourTurn, phases: [chargePhase]
  - effectRules: "Each enemy unit engaged with your unit makes a battle-shock roll, with -1 to that battle-shock roll"
- **THEN** the structured stratagem has:
  - `phase: "CHARGE"`
  - One effect: `{ category: "diceModifier", appliedTo: "Enemy", roll: "battleshock", action: "subtractFromRoll" }`

#### Scenario: Stratagem with text fallback

- **GIVEN** the "Readied Brawlers" stratagem with effectRules: "Units embarked within your unit can make an assault disembark move"
- **THEN** the structured stratagem has `effects: []` and `category: "OTHER"` with the original text preserved
- **AND** the rule is display-only for the simulator

### Requirement: Stratagem Structuring Pipeline

The AI structuring pipeline for stratagems SHALL follow the same pattern as `auto_structure.py` for abilities:

1. **Input**: raw stratagem data from `faction_data.json` (whenRules, targetRules, effectRules)
2. **AI Processing**: send to Claude API with the Effect catalogue as context, request structured output
3. **Output**: `structuring_proposals.json` with `StructuredStratagem` objects per detachment
4. **Review**: manual review in a UI screen analogous to Process Unit
5. **Confirm**: write CONFIRMED to storage (Supabase + IndexedDB)

The script SHALL be named `auto_structure_stratagems.py` and accept a faction name argument, consistent with existing scripts.

#### Scenario: AI proposes structured stratagem

- **WHEN** the AI structuring script processes a stratagem whose effectRules contain "+1 to wound rolls"
- **THEN** the proposal includes `{ category: "diceModifier", roll: "toWound", action: "addToRoll", appliedTo: "SelfUnit" }`
- **AND** the proposal preserves the full `originalText` for human verification

#### Scenario: AI falls back to OTHER

- **WHEN** the AI cannot decompose effectRules into known effect types (e.g. "place unit in strategic reserves")
- **THEN** the proposal has `effects: []` and is marked as `category: "OTHER"` with the original text

### Requirement: Stratagem Review Tag

Structured stratagem data SHALL use the same `UnitDataTag` values as abilities: `'PENDING'` | `'AI_PROPOSED'` | `'CONFIRMED'`. The tag lifecycle is identical:

- `AI_PROPOSED` when generated by the AI pipeline
- `PENDING` when imported but not yet reviewed
- `CONFIRMED` after manual review and approval

#### Scenario: Stratagem tag lifecycle

- **WHEN** `auto_structure_stratagems.py` generates proposals
- **THEN** proposals are stored with tag `AI_PROPOSED`
- **WHEN** a user reviews and confirms a stratagem's structured data
- **THEN** the tag becomes `CONFIRMED`

### Requirement: ConditionalEffects on Stratagems

Structured stratagems SHALL support the same `conditionalEffects` array as enhancements. This allows encoding faction-state-dependent effect variations (e.g. "Or: if the assault doctrine is active, also +1 AP").

The `ConditionalEffects` type is unchanged: `{ condition: string, effects: Effect[] }`.

#### Scenario: Stratagem with doctrine-conditional upgrade

- **WHEN** a stratagem has a base effect plus an upgraded version conditional on a combat doctrine
- **THEN** the base effect goes in `effects[]` and the upgraded version goes in `conditionalEffects[]`
- **AND** the `condition` string matches the existing convention (e.g. `"assault_doctrine"`)

### Requirement: Army Rules — Future Extension

Army rules and detachment rules SHALL NOT be structured in this version. They remain as raw text (`components[].textContent`).

A future extension MAY apply the unified pattern to:
- **Detachment rules** that are simple auras (e.g. "Friendly X units' ranged attacks have [Sustained Hits 1]") — these fit the pattern well
- **Army rules** that are phase-triggered (e.g. "At the start of the battle round, gain 1CP") — partial fit

Complex army rules involving state machines (Combat Doctrines, Waaagh!/riled up) or zone-based effects (Power Matrix) are unlikely to fit the pattern and should remain as text.

#### Scenario: Army rule not structured

- **WHEN** displaying an army rule
- **THEN** it is rendered from the raw `textContent` field
- **AND** it has no `Effect[]` representation

## Data Structures

### StructuredStratagem Interface

```typescript
interface StructuredStratagem {
  slug: string
  name: string
  cpCost: number
  turn: 'yourTurn' | 'opponentsTurn' | 'eitherPlayer'
  stratagemCategory: 'battleTactic' | 'strategicPloy' | 'epicDeed' | 'wargear' | ''

  // Common pattern fields
  phase: Phase
  trigger: string
  autoApply?: boolean
  frequency?: Frequency
  effects: Effect[]
  effectsOperator?: 'AND' | 'OR'
  conditionalEffects?: ConditionalEffects[]
  originalText: string

  // Stratagem-specific display fields
  targetDescription: string
  whenDescription: string
  secondaryEffect: string | null
  secondaryEffectCpCost: number | null
  restrictionRules: string | null
}
```

### DetachmentData Extension

```typescript
interface DetachmentData {
  tag: UnitDataTag | 'SCRAPED'
  data: unknown
  enhancements: StructuredEnhancement[] | null
  stratagems: StructuredStratagem[] | null  // NEW
}
```

### Cross-Reference: Shared Types

The following types from `schema.ts` are shared across all three categories without modification:

- `Effect` (union of 7 categories)
- `Phase` ('ANY' | 'MOVEMENT' | 'SHOOTING' | 'CHARGE' | 'FIGHT' | 'COMMAND')
- `Frequency` ('always' | 'perPhase' | 'perRound' | 'perBattle')
- `AppliesTo` ('SelfModel' | 'SelfUnit' | 'Enemy' | 'Ally')
- `TargetCondition` (keywords + mode)
- `ConditionalEffects` (condition + effects)

### Pattern Summary Table

| Field | StructuredAbility | StructuredEnhancement | StructuredStratagem |
|---|---|---|---|
| name | required | required | required |
| phase | required | — (implicit) | required |
| trigger | required | — (implicit) | required |
| frequency | optional | — | optional |
| autoApply | optional | — | optional |
| effects[] | required | required | required |
| effectsOperator | optional | — | optional |
| conditionalEffects | — | required | optional |
| originalText | optional | required | required |
| groupId/groupOperator | optional | — | — |
| eligibility | — | required | — |
| points | — | required | — |
| enhancementType/limit | — | required | — |
| cpCost | — | — | required |
| turn | — | — | required |
| stratagemCategory | — | — | required |
| targetDescription | — | — | required |

## Edge Cases

### Rules That Require Text Fallback

The following patterns (~12% of rules) do not fit the Effect catalogue and SHALL use category OTHER:

1. **Random tables**: "Roll D6: 1-3 X happens, 4-5 Y happens, 6 Z happens" (Orks Try Dat Button!)
2. **Faction state machines**: "Select one combat doctrine to be active" (SM Strategic Acumen), "riled up" state changes (Orks Waaagh!)
3. **Cross-unit delegation**: "This unit has that Warboss model's ability" (Orks Boss Boomer)
4. **Transport manipulation**: "Units embarked within can make an assault disembark move" (Orks Readied Brawlers)
5. **Deployment effects**: "Place unit in strategic reserves" (SM Blackstar Extraction)
6. **Opponent choice**: "Your opponent must choose: stand firm or duck for cover" (Necrons Atavistic Instigation)
7. **Revival/return**: "Set up the destroyed model on the battlefield" (Necrons Protocol of the Eternal Revenant)
8. **Ability modification**: "Add 3\" to the range of its other ability" (Necrons Atomic Energy Manipulator)
9. **CP modification**: "That use of the stratagem is -1 CP" (SM Brutalis Charge)
10. **Eligibility override**: "This unit is eligible to shoot and charge in a turn it Fell Back" (SM Adaptive Strategy)

### ConditionalEffects Alignment

The `conditionalEffects` pattern exists in enhancements and is proposed for stratagems. It is NOT part of `StructuredAbility`. If a future change adds conditional effects to abilities, the pattern is already proven.

Known condition strings: `assault_doctrine`, `devastator_doctrine`, `tactical_doctrine`, `riled_up`, `setup_this_turn`.

## Out of Scope

- Implementation of the AI structuring script for stratagems
- Implementation of the stratagem review UI
- Schema changes to `schema.ts` (this spec documents the target state)
- Structuring of army rules and detachment rules
- New effect categories beyond the existing 7
