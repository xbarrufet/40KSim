# Spec Delta

## ADDED Requirements

### Requirement: Mortal Wounds Effect Category

The `effects` array SHALL support a `mortalWounds` category for abilities that actively deal mortal wounds. A `mortalWounds` effect SHALL encode: `gameEvent` (when it fires), optional `preRoll` (gate roll), `targetScope` (which units are affected), optional `range`, base `amount`, and optional `amountByKeyword` overrides resolved most-restrictive-first.

#### Scenario: Per-model charge roll (Hammer of Wrath pattern)

- **WHEN** an ability deals mortal wounds for each model that lands a hit at the end of a charge
- **THEN** the effect is `{ category: "mortalWounds", gameEvent: "onCharge", targetScope: "engagedUnit", amount: { kind: "perModelRoll", threshold: 4, onSuccess: 1 } }`
- **AND** the simulator rolls one D6 per model in this unit engaged with the target, counts results at or above `threshold`, and multiplies by `onSuccess` to get the total mortal wounds

#### Scenario: Active ability with gate roll and keyword override (Haywire Mine pattern)

- **WHEN** an ability is player-activated in the Shooting phase, has a gate roll, and deals different mortal wounds depending on the target's keywords
- **THEN** the effect encodes `gameEvent: "activeAbility"`, a `preRoll` with `dice` and `threshold`, `targetScope: "selectedEnemyUnit"`, `range`, a base `amount`, and `amountByKeyword` listing each keyword override most-restrictive-first
- **AND** the simulator first rolls the `preRoll` dice and stops if the result is below `threshold`
- **AND** for the selected target, the simulator checks `amountByKeyword` in order and uses the first entry whose `targetKeyword` appears in the target unit's keyword list; if none match, the base `amount` is used

#### Scenario: Gate roll fails — no mortal wounds

- **WHEN** a `mortalWounds` effect has a `preRoll` and the rolled value is below `threshold`
- **THEN** no mortal wounds are dealt and no further steps of that effect are evaluated

#### Scenario: Keyword override applies

- **WHEN** the target unit has a keyword that matches an entry in `amountByKeyword`
- **THEN** the matching entry's `amount` is used instead of the base `amount`
- **AND** only the first matching entry is applied (most-restrictive-first ordering)

#### Scenario: No keyword override — base amount used

- **WHEN** the target unit's keywords do not match any entry in `amountByKeyword`
- **THEN** the base `amount` is used to calculate mortal wounds

### Requirement: Mortal Wounds Amount Strategies

A `mortalWounds` effect's `amount` SHALL be one of four strategies. `fixed` deals a constant number. `roll` sums `count` dice of size `dice` (D3 or D6) and adds `modifier`. `perModelRoll` rolls one D6 per eligible model, counts results at or above `threshold`, and multiplies by `onSuccess`. `multiDiceCount` rolls `diceCount` dice, counts results at or above `threshold`, and multiplies by `onSuccess`.

#### Scenario: Fixed mortal wounds

- **WHEN** `amount.kind` is `"fixed"`
- **THEN** exactly `amount.value` mortal wounds are dealt

#### Scenario: Rolled mortal wounds (D3 variant)

- **WHEN** `amount.kind` is `"roll"` with `dice: "D3"`
- **THEN** the simulator rolls `count` D3 dice (default 1), sums them, adds `modifier` (default 0), and deals that many mortal wounds

#### Scenario: Rolled mortal wounds (2D3 variant)

- **WHEN** `amount.kind` is `"roll"` with `dice: "D3"` and `count: 2`
- **THEN** the simulator rolls two D3 dice, sums them, and deals that many mortal wounds

#### Scenario: Multi-dice count (Thunderhawk Cluster Bombs pattern — deferred)

- **WHEN** `amount.kind` is `"multiDiceCount"`
- **THEN** the simulator rolls `diceCount` D6 dice, counts how many meet or exceed `threshold`, multiplies by `onSuccess`, and deals that many mortal wounds
- **AND** the `onMove` game event that triggers this pattern is deferred to v2 and not evaluated by the v1 simulator

### Requirement: Mortal Wounds Interact With FNP Defence

Each mortal wound dealt by a `mortalWounds` effect SHALL be applied individually, allowing the target unit's `damageMitigation` effect with `kind: "fnp"` and `condition: "vsMortalWounds"` to trigger on each wound.

#### Scenario: FNP roll per mortal wound

- **WHEN** a unit with Feel No Pain 4+ against mortal wounds is targeted by a `mortalWounds` effect that deals 3 mortal wounds
- **THEN** the simulator rolls three separate FNP dice, one per wound, and only wounds that fail the FNP roll are applied

### Requirement: Deferred Game Events

The game events `onDestroyed` (Deadly Demise) and `onMove` (movement-phase abilities) SHALL be valid values in the `MortalWoundsGameEvent` type for forward compatibility but SHALL NOT be evaluated by the v1 simulator.

#### Scenario: onDestroyed event not simulated in v1

- **WHEN** a `mortalWounds` effect has `gameEvent: "onDestroyed"`
- **THEN** the v1 simulator does not evaluate or display it during combat resolution
- **AND** the data is stored without modification so v2 can evaluate it without a re-structuring step
