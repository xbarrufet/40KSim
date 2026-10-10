# Proposal

## Why

Abilities like Stealth grant "benefit of cover" to a unit — a semantic state that can be cancelled by the attacker's IGNORES COVER keyword. The current schema has `weaponKeyword` (grants keywords to weapons) but no equivalent for granting keywords to units. Modelling Stealth as a `diceModifier` (+1 Save) would be incorrect because IGNORES COVER wouldn't cancel it, leading to wrong simulation results.

## What Changes

- **New effect category `unitKeyword`**: grants a keyword to a unit (as opposed to `weaponKeyword` which grants keywords to weapon profiles). Fields: `appliedTo`, `keyword` (from a known list of unit keywords), optional `value`.
- **Known unit keywords list**: initial set with `BENEFIT OF COVER`, extensible for future keywords like `SCOUTS`, `DEEP STRIKE`, `LONE OPERATIVE`.
- **Structuring form**: add "Keyword Unidad" option to the category dropdown. When selected, show a keyword dropdown (from the known unit keywords list) and an optional value input.
- **Simulator interaction** (data model only — v1 simulator does not resolve cover): the `unitKeyword` effect stores the keyword on the unit. The simulator will check for `BENEFIT OF COVER` on the defender and `IGNORES COVER` on the attacker's weapon when resolving saves. This interaction is documented but not implemented in v1.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `simulation-unit-data`: Add `unitKeyword` effect category to the Rule Types requirement and document the cover interaction semantics.
- `process-unit`: Add "Keyword Unidad" to the structuring form's category dropdown with a keyword selector.

## Impact

- **Schema**: new `UnitKeywordEffect` interface, new `KnownUnitKeyword` type, added to `Effect` union in `schema.ts`.
- **ProcessUnitView.tsx**: new case in `EffectFields`, `defaultEffectForCategory`, `describeEffect`, and the category dropdown.
- **No migration needed**: this is a new category, existing data is unaffected.
