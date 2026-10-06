# Tasks

## 1. Data model

- [x] 1.1 In `app/src/data/schema.ts`, add `matchedFactionSlug: string | null` to `ArmyListEntry`, set alongside `matchedUnitSlug` to record which faction (the entry's own, or its parent) a unit match was resolved against. Verify with `npm run build` (TypeScript check) in `app/`.

## 2. Parent faction resolution

- [x] 2.1 In `app/src/data/parseArmyList.ts`, add a `resolveParentFactionSlug(factionSlug, factions)` function: given a faction slug and the full list of known factions (`{ slug, name, category }`), find that faction's `category`, then find another faction in the same category whose own `name` equals the category string, and return its slug (or `null` if none, or if the faction itself has no category). Add test cases: a chapter resolving to `space-marines` (using the real category shape from `app/public/data/units.json`: category `"Space Marines"` containing a faction named `"Space Marines"` plus the chapters), a faction whose category has no self-named member (e.g. a Chaos legion in category `"Chaos"`, which contains no faction named `"Chaos"`) resolving to `null`, and a faction with no category resolving to `null`. Verify with `npx vitest run app/src/data/parseArmyList.test.ts`.

## 3. Unit and wargear matching with fallback

- [x] 3.1 Update `matchUnitNames` (or its caller) so that when an entry's unit name has no match among the entry's own faction's units, and a parent faction slug is available with its own known units, the entry is matched against the parent's units instead, recording `matchedFactionSlug` as whichever faction (own or parent) actually produced the match, or `null` when neither does. Keep the existing own-faction-first behavior unchanged for factions with no parent. Add test cases: a unit matched in the entry's own faction (matchedFactionSlug = own), a unit matched only via the parent (matchedFactionSlug = parent), a chapter-exclusive unit matched in its own faction even though a parent is available (fallback not reached), and a unit matched in neither (unmatched, matchedFactionSlug = null). Verify with `npx vitest run app/src/data/parseArmyList.test.ts`.
- [x] 3.2 Update the wargear-token matching step so it reads `unitData` from `matchedFactionSlug` (not always the parsed list's own `factionSlug`) when looking up the matched unit's known wargear catalogue. Add test cases: wargear tokens matched against the parent faction's `unitData.wargear` for a unit resolved via fallback, and wargear tokens still correctly unverified when the parent faction has no `unitData` for that unit either. Verify with `npx vitest run app/src/data/parseArmyList.test.ts`.
- [x] 3.3 Update `parseAndValidateArmyList` to compute the parent faction slug once (from the already-fetched `getAllFactions()` result) and fetch the parent's units/`unitData` only when a fallback is actually needed, per the Decisions in design.md. Add an end-to-end test using the sample Imperial Fists list (already in `parseArmyList.test.ts`): seed `imperial-fists` and `space-marines` factions with the real category shape, seed a generic unit (e.g. `Heavy Intercessor Squad`) and its `unitData` under `space-marines` only, and confirm the Imperial Fists entry for that unit resolves matched with its wargear tokens checked against the `space-marines` `unitData`. Verify with `npx vitest run app/src/data/parseArmyList.test.ts`.

## 4. Verification

- [x] 4.1 Run `npm run build`, `npm run lint`, and `npx vitest run` in `app/` and confirm all pass with no new errors or regressions in the existing `add-list-upload` tests.
- [x] 4.2 Manually verify in the running app (`npm run dev`): upload and process BaseData for a generic Space Marines unit under the `space-marines` faction (e.g. via the FACTIONS tab) until it has `unitData`, then paste an Imperial Fists list referencing that same unit by name in the LIST tab, and confirm the unit shows matched (green) with its wargear tokens matched against the `space-marines` data — without uploading anything under `imperial-fists` for that unit.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
