# Proposal

## Why

BaseData (raw scraped datasheets) isn't usable for simulation as-is: it mixes army-construction concerns, free-text ability prose, and faction-wide stubs with the actual stats/weapons/abilities a combat simulation needs. `faction-unit-browser` already defers "UnitData generation" as a future spec, and `simulation-unit-data` defines the target data shape but has no process for getting there. This change builds that process — the Process Unit screen and the automatic/manual pipeline that turns BaseData into reviewable, confirmable UnitData.

## What Changes

- New automatic preprocessing step: uploading BaseData for a unit that has no UnitData yet immediately generates a UnitData proposal (`tag: "PENDING"`) — stats, model profiles, and wargear catalogue are mechanically copied from BaseData; weapon-level keyword abilities (closed vocabulary, e.g. `TORRENT`, `SUSTAINED HITS 1`) are parsed into `{name, value}` automatically.
- New Process Unit screen: for every raw ability from BaseData (regardless of its `abilityType`), the user picks one of:
  - **Structure it** — produces one or more structured ability entries, each with an independent `rule`. One raw ability can fan out into multiple structured entries (e.g. an ability granting both +3 Attacks and Devastating Wounds becomes two entries sharing the same trigger).
  - **Remove it** — drops it from UnitData (the expected outcome for faction-stub and army-construction abilities, which carry no combat effect).
  - **Mark as `OTHER`** — keeps the original text verbatim for display during simulation; has no effect on simulation math.
- Saving on the Process Unit screen sets `tag: "CONFIRMED"`.
- **BREAKING**: Re-uploading BaseData for a unit that already has UnitData (`PENDING` or `CONFIRMED`) no longer regenerates UnitData — only BaseData is replaced. UnitData is only ever written by the automatic first-pass or by an explicit Confirm. This changes the previously accepted re-upload behavior in `faction-unit-browser`.
- **BREAKING**: The unit list status light collapses from three states (red/yellow/green, based on BaseData/UnitData presence) to two: red (`tag` is absent or `PENDING`) and green (`tag: "CONFIRMED"`).
- Rule vocabulary in `simulation-unit-data` is renamed/revised: `condition` → `trigger`, `appliesTo` (`self`/`enemyInRange`/`allyInRange`) → `appliedTo` (`SelfModel`/`SelfUnit`/`Enemy`/`Ally`), rule type `ability` → `addAttribute`, `StatModifier` → `statsModifier`. `SelfUnit` is only meaningful when the ability's context is `AsLeader` (the unit the leader has joined); `SelfModel` otherwise covers "this unit"/"this model" uniformly — confirmed against all 69 scraped Space Marines datasheets that no multi-model, non-leader squad has a per-miniature-scoped ability. `Enemy`/`Ally` carry over the existing `enemyInRange`/`allyInRange` behavior (the "in range" condition is expressed in the trigger question text, not the target name); targeting a specific *named* unit remains out of scope, as before.
- Adds an `OTHER` ability category to `simulation-unit-data` for text that doesn't reduce to a modifier or known keyword.
- The Process Unit screen's layout is redesigned to a datasheet-style presentation: per-miniature stats, composition costs/text, and led-by/supported-by tags (read from BaseData, display-only), plus ranged/melee weapon tables with ability-keyword chip badges — re-themed to the app's existing light palette.

## Capabilities

### New Capabilities
- `process-unit`: the BaseData → UnitData pipeline — automatic preprocessing on first upload, the per-ability review/structure/remove/mark-other workflow, fan-out of one raw ability into multiple structured entries, and the Confirm action that produces `CONFIRMED` UnitData.

### Modified Capabilities
- `simulation-unit-data`: rule field/type renames (`condition`→`trigger`, `appliesTo`→`appliedTo` with new enum values, `ability`→`addAttribute`), new `OTHER` ability category, fan-out (one ability → many rules), and the `tag: PENDING | CONFIRMED` field on UnitData.
- `faction-unit-browser`: unit list status light changes from 3-state (red/yellow/green) to 2-state (red/green) based on `tag`; re-upload behavior changes to never touch existing UnitData.

## Impact

- `app/src/data/db.ts` — IndexedDB access layer: `unitData` store gains a `tag` field; upload flow gains the auto-preprocess trigger (new-unit case only).
- `app/src/data/schema.ts` — needs the new UnitData/rule TypeScript interfaces (currently only the older `UnitProfile`/`WeaponProfile`/`AbilityProfile` catalog shapes exist, which this feature does not reuse).
- `app/src/home/HomeView.tsx` — unit list status light logic, upload confirm flow.
- New `Process Unit` screen/component (navigated to from the unit list's unit-name link, currently a dead link per `faction-unit-browser`).
- `openspec/specs/simulation-unit-data/spec.md` and `openspec/specs/faction-unit-browser/spec.md` — delta specs for the renames/behavior changes above.
