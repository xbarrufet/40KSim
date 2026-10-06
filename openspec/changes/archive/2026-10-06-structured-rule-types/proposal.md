# Proposal

## Why

The `Rule` type that encodes a structured ability's effect (`app/src/data/schema.ts`) is one flat shape with free-text `target`/`value` strings shared by all three rule kinds. This already lets unit-level and weapon-level effects collide under the same `statsModifier` type — the existing `processUnitLogic.test.ts` fixture sets `target: 'attacks'` on a `statsModifier`, even though `attacks` is a weapon-profile characteristic, not one of the fields in `UnitDataStats`. Nothing in the type system (or the Process Unit screen's free-text inputs) prevents an invalid target, a `diceModifier` with no actual throw specified, or an `addAttribute` naming something outside the known ability vocabulary. As more units get processed, this ambiguity will keep producing structured rules the simulation engine can't reliably interpret.

## What Changes

- **BREAKING**: Replace the single `Rule` interface with a discriminated union of four rule types, each carrying only its own valid fields:
  - `unitStatsModifier` — targets one of `Movement | Toughness | Save | Invulnerable | Wounds | ObjectiveControl | Leadership`
  - `weaponStatsModifier` — adds a `weaponTarget: 'ALL' | 'RANGE' | 'MELEE'` scope plus a `stat: Strength | Damage | Range | Attacks | AP | Skill` (`Skill` resolves to `ballisticSkill` or `weaponSkill` based on the weapon profile's `type`)
  - `diceModifier` — adds a `throw: Hit | Wound | Save | Damage | Battleshock` and a nested `modifier` that is either a flat adjustment (`{ kind: 'adjust', value }`) or a reroll instruction (`{ kind: 'reroll', reroll: '1' | 'ALL' }`)
  - `addAttribute` — adds a `weaponTarget: 'ALL' | 'RANGE' | 'MELEE'` scope and restricts `attribute` to the vocabulary already defined by `KNOWN_WEAPON_KEYWORDS` in `app/src/data/weaponKeywords.ts`
- Export `KNOWN_WEAPON_KEYWORDS` as a typed union (not just a runtime `Set<string>`) so `addAttribute.attribute` can be statically checked against it.
- Standardize attribute naming on the existing `KNOWN_WEAPON_KEYWORDS` format (space-separated, e.g. `DEVASTATING WOUNDS`) — the current test fixtures using underscores (`DEVASTATING_WOUNDS`) are non-conforming and will be corrected.
- Rework the Process Unit screen's structuring form (`ProcessUnitView.tsx`) to render the field set for the selected rule type instead of one generic `target`/`value` pair, and to source its `addAttribute` options from `KNOWN_WEAPON_KEYWORDS`.
- Update `buildStructuredAbilities` and other helpers in `processUnitLogic.ts` only as needed to keep passing through the new `Rule` union unchanged.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `simulation-unit-data`: the "Rule Types" and "Rule Target (appliesTo)" requirements change to describe the four-way discriminated union instead of `statsModifier | diceModifier | addAttribute` with a flat `target`/`value`. The "Structured Rules" requirement's example payloads are updated to match.

## Impact

- `app/src/data/schema.ts` — `Rule` type and its four variants
- `app/src/data/weaponKeywords.ts` — export the keyword vocabulary as a usable TS union
- `app/src/home/ProcessUnitView.tsx` — structuring form UI, `DEFAULT_RULE`, and the rule summary display
- `app/src/home/processUnitLogic.ts` — type-only follow-through, no logic change expected
- `app/src/home/processUnitLogic.test.ts`, `app/src/data/db.test.ts`, `app/src/home/uploadFlow.test.ts` — existing fixtures using the old flat `Rule` shape
- `openspec/specs/simulation-unit-data/spec.md` — delta to Rule Types / Rule Target requirements and examples
- No IndexedDB migration: `UnitData` records already in a browser's IndexedDB with the old `Rule` shape are out of scope (per-browser local data; no backend to migrate)
