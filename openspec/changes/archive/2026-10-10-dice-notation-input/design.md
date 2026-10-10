# Design

## Context

See proposal.md. The mortal wounds form (from `restructure-rules-system`) currently uses dropdown combos for fixed/roll values across two fields: `MortalWoundsHitsFields` and `MortalWoundsDamageFields`. Each requires 2-3 selectors. Dice notation is a natural shorthand 40K players already know.

## Goals / Non-Goals

**Goals:**
- Replace fixed/roll dropdown combos with a single text input using dice notation
- Provide reusable parse/serialize utilities for the notation format
- Validate on save, not on keystroke

**Non-Goals:**
- Changing `MortalWoundsResolution` (always/roll threshold) — this is not a dice notation field
- Changing `byStat` hits — this remains a dropdown
- Applying dice notation to other effect categories (statModifier, diceModifier, etc.) — those use simple fixed numbers

## Decisions

### 1. Dice notation regex

**Choice**: `^(?:[1-9]\d*|(?:[1-6])?D[36](?:\+[1-9]\d*)?)$`

Covers: `1`–`99+` (fixed), `D3`/`D6` (single die), `2D6`/`6D3` (multiple dice up to 6), `D6+2`/`3D3+1` (with positive modifier).

**Why limit to D3 and D6**: 40K only uses D3 and D6. D4, D8, D10 etc. don't exist in the game.

**Why limit dice count to 1-6**: No 40K ability uses more than 6 dice for a mortal wound calculation.

**Why no negative modifiers**: Not found in any mortal wound ability in the data. Can be extended later if needed.

### 2. Storage as string, parse on use

**Choice**: Store the notation as a plain string in IndexedDB. Parse to `{ count, dice, modifier }` at simulation time.

**Why over storing parsed form**: The string is what the user sees and types. Storing it avoids a serialize step on save and a roundtrip mismatch. The parse is trivial and only runs during simulation.

**Alternative considered**: Keep the typed union (`fixed | roll`) internally and only show notation in the UI. Rejected: adds complexity for no benefit — the string IS the canonical form.

### 3. `damagePerSuccess` becomes a plain string

**Choice**: `MortalWoundsDamage` type is removed. The `damagePerSuccess` field on `MortalWoundsEffect` becomes `string` (dice notation, default `"1"`).

**Why**: This field only has `fixed | roll` variants — no `byStat` or other special case. A plain string is sufficient.

### 4. `MortalWoundsHits` keeps two variants

**Choice**: `MortalWoundsHits` becomes `{ kind: 'notation'; value: string } | { kind: 'byStat'; stat: string }`.

**Why**: `byStat` cannot be expressed as dice notation. The hits field needs a mode selector (Notación vs Por Stats), but within "Notación" mode it's a single text input instead of 3 dropdowns.

### 5. Validation on save only

**Choice**: No inline validation. The "Guardar" button validates all notation fields and highlights invalid ones.

**Why**: Inline validation while typing dice notation is annoying — `"2D"` is invalid mid-typing but becomes valid as `"2D6"`. Save-time validation is simpler and less disruptive.

## Risks / Trade-offs

- **[Users unfamiliar with notation]** → The input placeholder shows the format. 40K players universally know this notation. The previous dropdowns remain gone, but a plain `"3"` for fixed values is self-explanatory.
- **[Migration of existing data]** → Straightforward serialize: `{ kind: 'fixed', value: 3 }` → `"3"`, `{ kind: 'roll', count: 2, dice: 'D3' }` → `"2D3"`. Can be done inline when reading old format.
