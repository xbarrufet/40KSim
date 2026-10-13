# Design

## Context

See proposal.md for motivation. The app reads data via `db.ts` functions that query Supabase by `faction_slug`. The change adds fallback logic: if no record exists for the requested faction, try the parent.

## Goals / Non-Goals

**Goals:**
- Shared units show the correct status (inherited from parent)
- Editing a shared unit writes to the parent, visible to all subfactions
- Subfaction-specific units work independently

**Non-Goals:**
- Dynamic parent detection from `factions.json` categories
- UI distinction between inherited and own units (may add later)
- Grey Knights inheritance (excluded — near-complete own roster)

## Decisions

### 1. Static `PARENT_FACTION` map in a new `factions.ts` module

A simple `Record<string, string>` constant with a helper `getParentFaction(slug)` and `getOwningFaction(factionSlug, unitSlug)`. The owning faction is determined by checking if `unit_data` or `base_data` exists under the subfaction first.

### 2. Fallback at the `db.ts` layer

The fallback logic lives in `db.ts` read functions (`getUnitStatuses`, `getStructuredAbilitiesData`, `getLoadoutData`, `getBaseData`). If the first query returns no result and a parent exists, a second query is made to the parent. This keeps the Supabase layer (`supabase.ts`) clean — it always queries a single faction slug.

### 3. Determining the owning faction for writes

`ProcessUnitView` needs to know whether a unit's data came from the subfaction or the parent, so it can write to the correct slug. The read functions return the data along with the resolved faction slug, or `ProcessUnitView` resolves it by checking `hasBaseData(subfactionSlug, unitSlug)` — if false, the unit is inherited.

Simpler approach: add a `resolvedFactionSlug` to the data returned by the read functions, or compute it once on mount in `ProcessUnitView`.

### 4. `getUnitStatuses` merges both faction results

For a subfaction, fetch `unit_data` for both the subfaction AND the parent in parallel, then merge — subfaction records take priority over parent records. This avoids N+1 queries.

## Risks / Trade-offs

- **Two Supabase calls per read for subfactions**: Acceptable — only happens for subfactions (11 out of all factions), and the parallel fetch keeps latency low.
- **Stale fallback**: If a shared unit is later given subfaction-specific data, it overrides the parent. This is the correct behavior.
