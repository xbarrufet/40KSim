# Design

## Context

See proposal.md - Why. The relevant current state:

- `Rule` (`app/src/data/schema.ts`) is one flat interface: `{ trigger, type: 'statsModifier' | 'diceModifier' | 'addAttribute', appliedTo, target: string, value: string | null }`. `target`/`value` are untyped strings for all three types.
- `KNOWN_WEAPON_KEYWORDS` (`app/src/data/weaponKeywords.ts`) is a runtime `Set<string>` used today only to auto-parse weapon-profile abilities during preprocessing (`process-unit` capability). It is not currently connected to `Rule` at all.
- `ProcessUnitView.tsx`'s `StructuringForm` renders one generic row (name, context, trigger, type select, appliedTo select, free-text target input, free-text value input) regardless of `rule.type`.
- `processUnitLogic.ts`'s `buildStructuredAbilities` is a pure pass-through (`rows.map(row => ({ type, name, rule }))`) — it doesn't branch on rule shape.
- No backend and no migration tooling exist; `UnitData` lives in each browser's IndexedDB (`app/src/data/db.ts`), seeded/written only by the app itself.

## Goals / Non-Goals

**Goals:**
- Make the four rule effects (unit-stat change, weapon-stat change, dice-roll change, attribute grant) mutually exclusive and self-describing at the type level, per the four variants in proposal.md.
- Keep `addAttribute`'s vocabulary and the weapon-profile auto-parser's vocabulary as one shared source of truth.
- Keep the Process Unit screen's structuring form usable with structured inputs (selects) instead of free text for every field that now has a known enum.

**Non-Goals:**
- No IndexedDB schema migration for already-stored `UnitData` records in a user's browser (per proposal.md - Impact: no backend, out of scope for v1; any `PENDING`/`CONFIRMED` unit processed before this change will need re-review on the Process Unit screen).
- No change to `AbilityContext` (`Alone` / `AsLeader` / `Always`), `appliedTo` values, or the per-ability review workflow in `process-unit` — only the `rule` payload shape changes.
- No attempt to reconcile the stale illustrative JSON in `simulation-unit-data/spec.md`'s free-form "Rule Examples" / "Data Structures" sections (they already use older field names like `condition`/`type: "StatModifier"` that don't match the current schema even before this change) — those aren't part of the Requirements delta mechanism; fixing them is a direct doc edit, tracked as a task.

## Decisions

**Discriminated union over flat interface.** `Rule` becomes `UnitStatsModifierRule | WeaponStatsModifierRule | DiceModifierRule | AddAttributeRule`, each extending a shared `{ trigger, appliedTo }` base. TypeScript then rejects a `weaponTarget` on a unit-stat rule, or a `diceModifier` missing `throw`, at compile time instead of allowing them through free-text fields. Alternative considered: keep one flat interface and add the new fields as optional — rejected because it keeps invalid combinations representable (e.g. a `weaponStatsModifier` with no `weaponTarget`), which is the exact class of bug this change exists to close.

**`Skill` as one combined weapon stat instead of separate Ballistic/Weapon skill values.** `WeaponStatsModifierRule.stat` includes a single `'Skill'` value. At apply time, resolving it against a given `WeaponProfileData` picks `ballisticSkill` when `profile.type === 'ranged'` and `weaponSkill` when `'melee'` — the same dispatch `splitWeaponProfiles` (`processUnitLogic.ts`) already does for display. Alternative considered: two separate stat values (`BallisticSkill`, `WeaponSkill`) — rejected because `weaponTarget` (`ALL`/`RANGE`/`MELEE`) already encodes the ranged-vs-melee distinction, so a second enum axis for the same distinction would be redundant and could disagree with `weaponTarget` (e.g. `weaponTarget: "MELEE", stat: "BallisticSkill"`).

**`addAttribute.attribute` sourced from `KNOWN_WEAPON_KEYWORDS`.** Change `weaponKeywords.ts` to export the list as a `const` tuple (`as const`) so a derived union type (`KnownAttribute = typeof KNOWN_WEAPON_KEYWORDS[number]`) can type `attribute`, while keeping the existing `Set`-based lookup for the runtime parsing path that already uses `.has()`. Alternative considered: a separate vocabulary just for `addAttribute` — rejected per the explore-mode discussion: the two lists already overlap in content (both describe the same core/weapon keywords), and maintaining them separately would let them drift.

**Attribute naming standardized on the keyword list's format (space-separated, e.g. `DEVASTATING WOUNDS`), not the underscored form in current test fixtures.** The keyword list is the established source scraped from real datasheet text; the underscored fixtures (`DEVASTATING_WOUNDS`) predate this change and are corrected as part of it rather than kept as a second accepted format.

**Nested tagged union for `diceModifier.modifier`.** `{ kind: 'adjust', value: string } | { kind: 'reroll', reroll: '1' | 'ALL' }` rather than two parallel optional fields (`value?`, `reroll?`) on `DiceModifierRule` directly. This makes "adjust XOR reroll" structurally guaranteed instead of a convention that both the form UI and any future simulation-engine code would have to re-check.

**UI: per-type field rendering in `StructuringForm`.** The form switches on `row.rule.type` to render only that variant's fields (e.g. `stat` + `value` for `unitStatsModifier`; `weaponTarget` + `stat` + `value` for `weaponStatsModifier`; `throw` + a kind toggle for `diceModifier`; `weaponTarget` + an `attribute` select sourced from `KNOWN_WEAPON_KEYWORDS` for `addAttribute`). Changing `rule.type` resets the row's rule to that variant's default shape (mirroring the existing single `DEFAULT_RULE` constant, now one default per variant) rather than trying to carry over fields that don't exist on the new variant.

## Risks / Trade-offs

- **Existing `PENDING`/`CONFIRMED` UnitData in a user's browser becomes stale relative to the new type.** → No migration is written (see Non-Goals); any unit already structured under the old shape will need to be re-opened and re-structured on the Process Unit screen. Acceptable because this app has no users yet beyond the developer's own local data, per project context (no backend, local-only).
- **`Skill` collapsing ballistic/weapon skill could be the wrong call for a rule that genuinely only makes sense on one weapon type.** → `weaponTarget: "RANGE"` or `"MELEE"` already scopes which profiles are touched, so `stat: "Skill"` combined with a specific `weaponTarget` still expresses "only this unit's ranged weapons' to-hit" precisely; `ALL` is only used when the ability text itself doesn't distinguish.
- **Standardizing attribute names on the space-separated format is a breaking change to any already-saved `addAttribute` rule using the underscored form.** → Covered by the same no-migration decision above; new rules created after this change are always well-formed.
