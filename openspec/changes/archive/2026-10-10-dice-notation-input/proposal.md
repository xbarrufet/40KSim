# Proposal

## Why

Several form fields in the ability structuring UI use a two-step pattern (dropdown to pick "Fijo" or "Tirada", then sub-fields for value or dice). This adds clicks and visual noise for something that players already express as a single string — standard dice notation like "3", "D6", "2D3+1". Replacing those dropdowns with a single validated text input simplifies the UI and matches how Warhammer 40K values are naturally written.

## What Changes

- **New reusable `DiceNotationInput` component**: a text input that accepts standard dice notation matching the pattern `^(?:[1-9]\d*|(?:[1-6])?D[36](?:\+[1-9]\d*)?)$`. Valid examples: `3`, `D6`, `D3+2`, `2D6`, `3D3+1`. Validation on save (not on keystroke) with visual error feedback.
- **New shared type `DiceNotation`**: replaces the `{ kind: 'fixed'; value } | { kind: 'roll'; count; dice }` union pattern with a single `string` field storing the notation, plus parse/serialize utility functions.
- **Mortal wounds form simplified**: replace `MortalWoundsHitsFields` (Fijo/Tirada dropdowns) and `MortalWoundsDamageFields` (Fijo/Tirada dropdowns) with `DiceNotationInput`. The `byStat` option on hits remains as a separate selector since it doesn't fit dice notation.
- **Validation on save**: the "Guardar" action validates all dice notation fields and highlights invalid ones before allowing save.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `process-unit`: Replace fixed/roll dropdown combos in mortal wounds form with a dice notation text input, add save-time validation.
- `simulation-unit-data`: Replace `MortalWoundsHits` fixed/roll variants and `MortalWoundsDamage` with `DiceNotation` string type, add parse/serialize utilities.

## Impact

- **Schema**: `MortalWoundsHits` loses `fixed` and `roll` variants, gains `{ kind: 'notation'; value: string }`. `MortalWoundsDamage` replaced entirely by `string` (dice notation). Parse utilities convert to/from runtime values for the simulator.
- **ProcessUnitView.tsx**: `MortalWoundsHitsFields` and `MortalWoundsDamageFields` simplified to use `DiceNotationInput`.
- **Data compatibility**: existing stored effects with `kind: 'fixed'` or `kind: 'roll'` need migration to the notation string format. This is a serialize operation (`{ kind: 'fixed', value: 3 }` → `"3"`, `{ kind: 'roll', count: 2, dice: 'D3' }` → `"2D3"`).
