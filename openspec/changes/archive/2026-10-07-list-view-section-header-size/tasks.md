# Tasks

## 1. Bump section header text size

- [x] 1.1 Change `.process-unit-section h2`'s `font-size` from `13px` to `15px` in `App.css`, and verify by inspecting computed styles in a real browser that "Models", "Ranged Weapons", "Melee Weapons", and "Abilities" on the list-view screen all render at 15px
- [x] 1.2 Load the Process Unit screen and verify its own section headers (e.g. "Costs", "Abilidades revisadas") also render at the new size with nothing visually broken, since they share the same class
- [x] 1.3 Run `npm run lint`, `npm run build`, and `npm test` from `app/` and verify all pass
