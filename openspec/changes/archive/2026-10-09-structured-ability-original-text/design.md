# Design

## Context

`StructuredAbility` in `schema.ts` has no field for the original BaseData rules text. The Process Unit screen currently shows the text on unreviewed abilities from `raw.text`, and on the edit form from a runtime `baseDataAbilitiesMap` lookup (recently improved with fallbacks). The reviewed collapsed row has no text context at all.

`buildStructuredAbilities(rows: StructuringRow[])` in `processUnitLogic.ts` maps `StructuringRow[]` → `StructuredAbility[]` and knows nothing about the raw ability source. The callers (`commitStructuring`, `commitEdit`) have the raw text at commit time.

## Goals / Non-Goals

**Goals:**
- `originalText` is stored in the first structured ability produced from a raw ability at the moment of structuring.
- Reviewed collapsed rows display `originalText` when present.
- `auto_structure.py` embeds `originalText` on new proposals; `enrich_proposals.py` backfills existing ones offline.

**Non-Goals:**
- Retroactively setting `originalText` on abilities already in IndexedDB — the field is optional; old records silently omit the text until re-structured.
- Showing `originalText` on fan-out entries (efecto 2+).
- Using `originalText` in the simulator.

## Decisions

### 1. `originalText` set in callers, not in `buildStructuredAbilities`

`buildStructuredAbilities` is a pure transformation; adding source-text awareness would couple it to a concern outside its scope. Instead, callers mutate `newAbilities[0].originalText` after the call:

```
commitStructuring:
  newAbilities = buildStructuredAbilities(structuringRows)
  newAbilities[0].originalText = draft.rawAbilities[structuringIndex]?.text

commitEdit:
  newAbilities = buildStructuredAbilities(structuringRows)
  newAbilities[0].originalText = editingAbility.originalText ?? editingAbilityText ?? undefined
```

`StructuringRow` does NOT gain `originalText` — it's a form-row type and doesn't need it.

### 2. `startEditing` prefers `ability.originalText` first

```
const baseName = ability.name.replace(/\s+\(efecto \d+\)$/, '')
setEditingAbilityText(
  ability.originalText ??          // <-- new first step
  baseDataAbilitiesMap[ability.name] ??
  baseDataAbilitiesMap[baseName] ??
  rawAbilities.find(...) ??
  null
)
```

### 3. Reviewed row renders `originalText` below the summary

Inline, no expand/collapse. Uses existing `.raw-ability-text` class and `<FormattedAbilityText>`.

### 4. `auto_structure.py` post-processes generated abilities

After `structure_unit` returns, the main loop adds `originalText` from the BaseData ability map:

```python
ab_rules = {a['name']: a['rules'] for a in unit_data.get('abilities', []) if a.get('rules')}
for ab in abilities:
    name = ab.get('name', '')
    if not re.search(r'\s+\(efecto \d+\)$', name) and name in ab_rules:
        ab['originalText'] = ab_rules[name]
```

No extra API call; the BaseData is already loaded.

### 5. `enrich_proposals.py` — offline backfill

Reads `structuring_proposals.json`, reads each unit's BaseData, builds the name→rules map, sets `originalText` where missing (skipping `(efecto N)` names), writes back. Idempotent.

## File Touchpoints

| File | Change |
|---|---|
| `app/src/data/schema.ts` | Add `originalText?: string` to `StructuredAbility` |
| `app/src/home/ProcessUnitView.tsx` | `commitStructuring`, `commitEdit`, `startEditing`, reviewed row JSX |
| `data/auto_structure.py` | Post-process generated abilities with `originalText` |
| `data/enrich_proposals.py` | New offline enrichment script |
