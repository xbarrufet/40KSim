# Tasks

## 1. Supabase: Army Rules Column

- [x] 1.1 Add `army_rules` JSONB nullable column to the `factions` table in Supabase. Verify by querying the table schema.
- [x] 1.2 Extend `seed_supabase.py` to populate `army_rules` from `faction_data.json` when upserting a faction. Verify by running `seed_supabase.py --faction "Space Marines" --detachments-only` and checking the `factions` row has `army_rules` populated. Note: since army rules are faction-level, the seed should set them during the main faction upsert, not only in detachments-only mode.
- [x] 1.3 Add `fetchArmyRules(factionSlug)` to `supabase.ts` that fetches `army_rules` from the `factions` table, falling back to parent faction for subfactions. Update `FactionRow` to include `army_rules`. Verify with `npm run build`.

## 2. Subtab Navigation in UnitsView

- [x] 2.1 Add a `subtab` state (`'datasheets' | 'armyRules' | 'detachments'`) to `UnitsView.tsx`. Render a horizontal tab bar below the faction name with DATASHEETS, ARMY RULES, DETACHMENTS. Style it to match the 40k.app reference (uppercase, dark background, active tab highlighted). Verify by running the dev server and seeing the tab bar.
- [x] 2.2 Wrap the existing unit list content (columns grid, upload modal, proposals import modal, backup dialogs) so it only renders when `subtab === 'datasheets'`. Remove the "DET" button from the toolbar. Verify the DATASHEETS tab shows the unit list as before.
- [x] 2.3 When `subtab === 'detachments'`, render the `DetachmentsView` inline (without its own back button and header — those come from the parent). Verify the DETACHMENTS tab shows the detachments list.

## 3. Army Rules View

- [x] 3.1 Create an `ArmyRulesView.tsx` component that fetches army rules via `fetchArmyRules` and renders each rule with its name as heading and text content via `FormattedAbilityText`. Handle the empty state. Verify by navigating to ARMY RULES for Space Marines and seeing the rules.
- [x] 3.2 Wire `ArmyRulesView` into UnitsView when `subtab === 'armyRules'`. Verify by switching between all three tabs. Run `npm run build` and `npm run lint` to confirm no regressions.

## Workflow follow-up

- Archive the change after all tasks are complete and reviewed.
