# Proposal

## Why

The `DiceModifierEffect` supports re-rolls and modifiers for hit, wound, and saving throw rolls, but not for damage rolls. In 40K, damage is often a dice roll (e.g., D6 damage) and abilities like "re-roll damage rolls" need to be structurable. Without `damage` as a roll type, these abilities have to be marked as OTHER.

## What Changes

- **Extend `DiceModifierEffect.roll`**: add `'damage'` and `'hazard'` to the union type `'toHit' | 'toWound' | 'savingThrow' | 'damage' | 'hazard'`.
- **Update structuring form**: add "Daño" and "Hazard" options to the roll dropdown in the dice modifier form fields.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `simulation-unit-data`: Add `'damage'` and `'hazard'` to the `DiceModifierEffect` roll values.
- `process-unit`: Add "Daño" and "Hazard" options to the dice modifier roll dropdown.

## Impact

- **Schema**: one value added to the `roll` field union in `DiceModifierEffect` in `schema.ts`.
- **ProcessUnitView.tsx**: one `<option>` added to the roll `<select>` in the `diceModifier` case of `EffectFields`.
- **No migration**: additive change, existing data unaffected.
