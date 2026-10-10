# Tasks

## 1. Migration script

- [x] 1.1 Create `data/migrate_proposals.py` that reads `structuring_proposals.json`, applies all format transformations (attackType→phase, appliedTo to effect level, mortalWounds old→new format, Deadly Demise→OTHER), and rewrites the file. Verify the script runs without errors on `space-marines`.
- [x] 1.2 Run `python3 data/migrate_proposals.py "Space Marines"` and verify: all 100 abilities have `phase` instead of `attackType`, all effects have `appliedTo`, mortalWounds effects use `hits`/`resolution`/`damagePerSuccess` with dice notation strings, Deadly Demise abilities are converted to OTHER.

## 2. Remove legacy guards

- [x] 2.1 Remove the `if (!effect.resolution || !effect.hits)` guard in `describeEffect` (mortalWounds case) in `ProcessUnitView.tsx`. Remove the auto-migration block in `EffectFields` mortalWounds case. Verify `npm run build` passes.

## 3. Verification

- [x] 3.1 Run `npm run build` and `npm run lint` with zero errors. Re-import the migrated `structuring_proposals.json` in the app and verify no console errors when viewing units with mortal wounds abilities.

## Workflow follow-up

- Archive the change after verifying all task groups.
