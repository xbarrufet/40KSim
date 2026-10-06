# Tasks

## 1. Shared attribute vocabulary

- [x] 1.1 In `app/src/data/weaponKeywords.ts`, change `KNOWN_WEAPON_KEYWORDS` to a `const` array with `as const` (keeping or adding a `Set` built from it for the existing `.has()` lookups), and export a derived `KnownAttribute` union type (`typeof KNOWN_WEAPON_KEYWORDS[number]`). Verify `npm run build` (TypeScript check) passes and `weaponKeywords.test.ts` still passes unchanged.

## 2. Rule type union

- [x] 2.1 In `app/src/data/schema.ts`, replace the flat `Rule` interface with the four-variant discriminated union per design.md - Decisions: `UnitStatsModifierRule` (`stat: Movement|Toughness|Save|Invulnerable|Wounds|ObjectiveControl|Leadership`, `value`), `WeaponStatsModifierRule` (`weaponTarget: ALL|RANGE|MELEE`, `stat: Strength|Damage|Range|Attacks|AP|Skill`, `value`), `DiceModifierRule` (`throw: Hit|Wound|Save|Damage|Battleshock`, `modifier: {kind:'adjust',value}|{kind:'reroll',reroll:'1'|'ALL'}`), `AddAttributeRule` (`weaponTarget`, `attribute: KnownAttribute`, `value: string | null`), each extending a shared `{ trigger: string; appliedTo: 'SelfModel'|'SelfUnit'|'Enemy'|'Ally' }` base. Export `Rule` as their union. Verify `npm run build` reports the expected type errors in the files touched by tasks 3-5 (confirms the union is wired through) and none inside `schema.ts` itself.

## 3. processUnitLogic update

- [x] 3.1 Update `app/src/home/processUnitLogic.ts`'s `StructuringRow`/`buildStructuredAbilities` types to use the new `Rule` union (logic stays a pass-through per design.md - Context). Verify `npm run build` passes with no errors in this file.
- [x] 3.2 Rewrite the `Rule` fixtures in `app/src/home/processUnitLogic.test.ts` (currently `BASE_RULE` with `type: 'statsModifier', target: 'attacks' | 'objectiveControl'`, and `type: 'addAttribute', target: 'DEVASTATING_WOUNDS'`) to use the new variants - the `attacks +3` example becomes a `weaponStatsModifier` (`weaponTarget: 'ALL'`, `stat: 'Attacks'`), the `objectiveControl +1` example becomes a `unitStatsModifier` (`stat: 'ObjectiveControl'`), and `DEVASTATING_WOUNDS` becomes an `addAttribute` with `attribute: 'DEVASTATING WOUNDS'` (space-separated, per design.md's naming standardization) and a `weaponTarget`. Verify `npm test -- processUnitLogic.test.ts` (or the project's vitest invocation) passes.

## 4. Process Unit screen UI

- [x] 4.1 In `app/src/home/ProcessUnitView.tsx`, replace the single `DEFAULT_RULE` constant with one default per `Rule` variant, and update the rule-type `<select>`'s `onChange` to reset the row to that variant's default (per design.md - Decisions: UI). Verify `npm run build` passes and manually exercise the Process Unit screen in the dev server to confirm switching the type dropdown no longer leaves stale fields (e.g. a leftover free-text `target` value) on the row.
- [x] 4.2 Rework `StructuringForm` to render per-variant fields instead of the generic `target`/`value` text inputs: a `stat` select for `unitStatsModifier`; `weaponTarget` + `stat` selects for `weaponStatsModifier`; a `throw` select plus an adjust/reroll toggle (value text input, or `1`/`ALL` reroll select) for `diceModifier`; a `weaponTarget` select + an `attribute` select populated from `KnownAttribute`/`KNOWN_WEAPON_KEYWORDS` plus an optional qualifier value input for `addAttribute`. Verify in the dev server that structuring an ability of each of the four types saves a `rule` object matching its variant's shape (inspect via browser devtools IndexedDB, or add a temporary console log while testing, then remove it).
- [x] 4.3 Update the rule summary line (`ProcessUnitView.tsx:311`, `{ability.rule.trigger} · {ability.rule.type} · {ability.rule.appliedTo} · {ability.rule.target}`) to render the fields that exist for the ability's actual `rule.type` instead of the no-longer-existing generic `target`. Verify by viewing a processed unit's ability list in the dev server for each of the four rule types.

## 5. Spec documentation touch-up

- [x] 5.1 Directly edit `openspec/specs/simulation-unit-data/spec.md`'s free-form "Rule Examples" section (outside the Requirements delta mechanism, per design.md - Non-Goals) to use the new field names (`trigger`/`appliedTo` instead of `condition`/`appliesTo`, and the new `type` values) instead of the already-stale `condition`/`type: "StatModifier"` wording. Verify by re-reading the section for consistency with the updated Rule Types requirement.

## 6. Verification

- [x] 6.1 Run the full test suite (`npm test`) and `npm run build` from `app/` and confirm both pass with no leftover references to the old flat `Rule` shape (`grep -rn "rule.target\|rule\.type === 'statsModifier'" app/src` returns nothing).
- [x] 6.2 Run `npm run lint` from `app/` and confirm oxlint reports no new issues introduced by this change.

## Workflow follow-up

- Archive this change once implementation and verification are complete.
