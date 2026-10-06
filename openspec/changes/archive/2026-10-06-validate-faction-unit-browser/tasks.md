# Tasks

## 1. Archive the spec delta

- [x] 1.1 Review the delta spec (`specs/faction-unit-browser/spec.md`) against the main spec to confirm all MODIFIED requirements carry forward the full original content plus corrections. Verify by comparing each MODIFIED requirement header with the main spec's headers — they must match exactly (whitespace-insensitive).
- [x] 1.2 Run `openspec validate --change "validate-faction-unit-browser"` and confirm it passes with no errors.
- [x] 1.3 Archive the change with `openspec archive --change "validate-faction-unit-browser"`. Verify the main spec at `openspec/specs/faction-unit-browser/spec.md` now includes the corrected Admin Removal file list (with `factionDetail.css`), the slug-related scenarios under "First launch", the three new ADDED requirements, and that "No Edit/View Toggle" is removed.

## 2. Post-archive verification

- [x] 2.1 Read the archived main spec and confirm: (a) Admin Removal lists 8 files including `factionDetail.css`, (b) "First launch" requirement mentions explicit `slug` fields in the seed file, (c) "Slug field in seed data" requirement exists with 3 scenarios, (d) "No empty-state admin reference" requirement exists, (e) "No faction-level status lights" requirement exists, (f) "No Edit/View Toggle" requirement is gone.
- [x] 2.2 Run `openspec list --specs` and confirm `faction-unit-browser` still appears with the updated requirement count.

## Workflow follow-up

- After archiving, propose the implementation change for `faction-unit-browser` using `/opsx:propose` — that change will modify application code, the scraper, and TypeScript interfaces per the corrected spec.
