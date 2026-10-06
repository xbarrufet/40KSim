# Spec Delta

## MODIFIED Requirements

### Requirement: Rule Types

The `rule.type` field SHALL be one of `unitStatsModifier`, `weaponStatsModifier`, `diceModifier`, or `addAttribute`, each with its own fields:

- `unitStatsModifier` — changes a unit-level characteristic. Has a `stat` field, one of `Movement`, `Toughness`, `Save`, `Invulnerable`, `Wounds`, `ObjectiveControl`, `Leadership`, plus a `value` (e.g. `objectiveControl` stat +1).
- `weaponStatsModifier` — changes a weapon-profile characteristic. Has a `weaponTarget` field (`ALL`, `RANGE`, or `MELEE`) scoping which of the unit's weapon profiles are affected, a `stat` field, one of `Strength`, `Damage`, `Range`, `Attacks`, `AP`, `Skill` (`Skill` resolves to the targeted profile's `ballisticSkill` when ranged or `weaponSkill` when melee), plus a `value`.
- `diceModifier` — modifies a dice roll result without changing the underlying characteristic. Has a `throw` field, one of `Hit`, `Wound`, `Save`, `Damage`, `Battleshock`, and a `modifier` that is either a flat adjustment (`{ kind: "adjust", value }`, e.g. +1 to save rolls) or a reroll instruction (`{ kind: "reroll", reroll: "1" | "ALL" }`).
- `addAttribute` — grants a normalised weapon/core ability. Has a `weaponTarget` field (`ALL`, `RANGE`, or `MELEE`) scoping which weapon profiles receive the attribute, and an `attribute` field restricted to the project's known ability vocabulary (e.g. `SUSTAINED HITS`), plus an optional qualifier `value` (e.g. `"1"` in `SUSTAINED HITS 1`).

#### Scenario: Unit-level stat change
- **WHEN** a rule changes a unit's own characteristic (e.g. objectiveControl +1)
- **THEN** use `unitStatsModifier` with `stat: "ObjectiveControl"` and `value: "+1"`

#### Scenario: Weapon-level stat change scoped by weapon type
- **WHEN** a rule changes a characteristic of this unit's weapons, and the effect differs between ranged and melee weapons (or applies to only one)
- **THEN** use `weaponStatsModifier` with `weaponTarget` set to `"RANGE"`, `"MELEE"`, or `"ALL"` and the relevant `stat`

#### Scenario: StatModifier vs diceModifier
- **WHEN** a rule modifies the save characteristic itself
- **THEN** use `unitStatsModifier` with `stat: "Save"`
- **WHEN** a rule instead modifies the save **roll** (per 10th edition rules, these don't always stack the same as a characteristic change)
- **THEN** use `diceModifier` with `throw: "Save"`

#### Scenario: Reroll vs flat adjustment
- **WHEN** a rule rerolls a dice result (e.g. "reroll Wound rolls of 1") rather than adding to or subtracting from it
- **THEN** use `diceModifier` with `modifier: { kind: "reroll", reroll: "1" }` (or `"ALL"` to reroll all failed/all results, per the ability's wording)
- **WHEN** a rule instead adds to or subtracts from the roll (e.g. "+1 to Hit")
- **THEN** use `diceModifier` with `modifier: { kind: "adjust", value: "+1" }`

#### Scenario: Granting an attribute restricted to known vocabulary
- **WHEN** a rule grants a weapon/core ability keyword
- **THEN** `addAttribute.attribute` SHALL be one of the project's known ability keywords (the same vocabulary used to automatically parse weapon-profile abilities per the Weapon-Level Ability Parsing requirement in `process-unit`), not an arbitrary string
