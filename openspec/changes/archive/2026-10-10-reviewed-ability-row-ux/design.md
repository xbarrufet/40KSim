# Design

## Context

The reviewed ability row currently renders three elements in the collapsed state:
1. Ability name + structured summary (or OTHER text)
2. A `<select>` for `ability.type` (Always / Alone / AsLeader) — to be removed
3. "Editar" button (structured only) + "Quitar" button

OtherAbility has no edit path. Fixing the text of a wrong OTHER requires deleting it and re-reviewing from the raw queue.

## Decisions

### 1. Remove type select from collapsed row

Delete the `<select>` and its `onChange` handler from the collapsed row JSX. The type remains editable:
- Structured: via the "Contexto" dropdown inside StructuringForm when the user clicks "Editar"
- OTHER: via the new inline edit form (type field added there)

### 2. `editingOtherIndex` + `editingOtherText` as local state

Two new pieces of state: `editingOtherIndex: number | null` and `editingOtherText: string`. When "Editar" is clicked on an OTHER row, both are set from the ability. This keeps the OTHER edit form stateless from the draft's perspective until "Guardar" is pressed.

### 3. "Estructurar" from OTHER edit → reuse existing structured editing flow

Clicking "Estructurar" in the OTHER edit form:
1. Sets `editingAbilityIndex = editingOtherIndex` (reuses the existing structured editing path)
2. Sets `editingAbilityText = editingOtherText` (shows the text above the structuring form)
3. Seeds `structuringRows` with a single row carrying the ability name, default type Always, default effect
4. Clears `editingOtherIndex`

`commitEdit` already handles replacing an ability at `editingAbilityIndex` regardless of whether the original was structured or OTHER — no change needed there.

## File Touchpoints

| File | Change |
|---|---|
| `app/src/home/ProcessUnitView.tsx` | Remove type select from collapsed row; add `editingOtherIndex`/`editingOtherText` state + handlers + inline form JSX |
