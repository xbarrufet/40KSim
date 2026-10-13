# Design

## Context

See proposal.md for motivation. The existing pipeline for abilities (`auto_structure.py` → `seed_supabase.py` → Process Unit screen) is the direct model for this change. The loadout pipeline mirrors it structurally: Python script generates AI proposals, seed script uploads to Supabase, app displays for review.

BaseData already contains two complementary data sources per unit:
- `wargearRules`: array of `{ id, rulesText, displayOrder }` — human-readable replacement rules
- `wargear`: array of `{ wargearItem: { id, name, wargearType, profiles }, isDefault, isConfigurable }` — full wargear catalogue with numeric IDs

The AI must combine both: parse the text rules and resolve each weapon name to its `wargearItem.id` from the catalogue.

## Goals / Non-Goals

**Goals:**
- Structured JSON representation of every wargear replacement rule per unit
- AI-generated proposals that link text rules to actual wargearItem IDs
- Approve/reject review per rule in the existing Process Unit screen
- Same Supabase-first persistence pattern as abilities

**Non-Goals:**
- Field-by-field editing of structured loadout options (future iteration)
- Loadout validation or combination generation (downstream consumer, not this change)
- Automatic re-generation of loadout proposals on BaseData re-upload

## Decisions

### 1. Separate `loadout_data` table (not extending `unit_data`)

Abilities and loadout have independent review lifecycles — a unit's abilities can be CONFIRMED while loadout is still AI_PROPOSED. A separate table avoids coupling their tags and allows independent queries.

**Alternative**: Adding `loadout_options` + `loadout_tag` columns to `unit_data`. Rejected because mixed tags complicate queries and the single-row-per-unit model becomes overloaded.

### 2. Mirror `auto_structure.py` architecture for `auto_loadout.py`

Same client setup (Bedrock/direct API), same faction-based batch processing, same output structure (`loadout_proposals.json` keyed by `faction-slug/unit-slug`). Reduces cognitive overhead and reuses proven patterns.

**Alternative**: A unified script that does both abilities and loadout. Rejected because they run independently and combining them makes partial re-runs harder.

### 3. Approve/reject per rule (not field-by-field editing)

Wargear rules are mechanical text patterns. The AI output is either correct (IDs match, scope parsed right) or wrong. Approve/reject is sufficient for V1 — if the AI gets it wrong, the user rejects and the rule is excluded.

**Alternative**: Full form editor per rule. Deferred — adds significant UI complexity for a problem that may not arise frequently given the formulaic nature of wargear rules.

### 4. TypeScript interfaces in `schema.ts`

New interfaces (`StructuredLoadoutData`, `WargearOption`, `WargearChoice`, `WargearScope`, `WargearRef`) live alongside existing ability types. The `StructuredLoadoutData` follows the same `tag` pattern as `StructuredAbilitiesData`.

```typescript
interface WargearRef {
  name: string
  wargearItemId: number
}

interface WargearScope {
  type: 'model' | 'allModels' | 'anyNumber' | 'ratio'
  role?: string
  ratio?: { per: number; count: number }
}

interface WargearChoice {
  items: { count: number; name: string; wargearItemId: number }[]
  grants?: WargearRef[]
  locks?: number[]
}

interface WargearOption {
  scope: WargearScope
  replaces: WargearRef[]
  choices: WargearChoice[]
  isAdditional: boolean
  originalRuleId: number
  originalText: string
}

interface StructuredLoadoutData {
  tag: UnitDataTag
  options: WargearOption[]
}
```

### 5. AI prompt provides wargear catalogue as context

The prompt to Claude includes both `wargearRules` (text to parse) and a simplified `wargear` catalogue (id + name pairs). This lets the AI resolve names to IDs in a single call without a second lookup pass.

### 6. IndexedDB store for loadout cache

A new `loadoutData` object store in IndexedDB (keyed by `[faction_slug, unit_slug]`) mirrors the pattern of the existing `unitData` store. Read path: serve from IndexedDB, revalidate against Supabase in background.

## Risks / Trade-offs

- **AI accuracy on complex rules**: Rules with compound constraints (Cyclone + Storm Bolter + lock) are harder to parse. Mitigation: the approve/reject flow catches errors, and rejected rules are simply excluded.
- **wargearItemId drift**: If BaseData is re-scraped with different IDs, existing proposals become stale. Mitigation: same risk exists for abilities; re-running the AI script regenerates proposals.
- **UI section size**: Units with many wargear rules (e.g., 5-6 rules) will produce a long loadout section. Mitigation: acceptable for V1 given the approve/reject UI is compact per rule.
