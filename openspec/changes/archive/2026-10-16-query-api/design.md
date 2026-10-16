# Design

## Context

40KSim stores all shared data in Supabase (tables: `factions`, `units`, `base_data`, `unit_data`, `loadout_data`, `detachment_data`). The PWA queries these tables via the Supabase JS client. There is no server-side API layer — external consumers have no way to fetch this data programmatically. See proposal.md for motivation.

The project has no `supabase/` directory yet; Edge Functions are a new addition.

## Goals / Non-Goals

**Goals:**
- Expose three read-only HTTP endpoints via Supabase Edge Functions
- Return data in the `UnitFull` grouped format (see `docs/api-spec.md`)
- Support subfaction parent fallback (same logic as the PWA)
- Keep the Edge Functions simple — direct Supabase queries, no ORM

**Non-Goals:**
- Write endpoints (all mutations remain via the PWA or Python scripts)
- Rate limiting or API key management beyond the existing Supabase anon key
- Pagination (faction data sets are small enough to return in full)
- Caching layer (Supabase handles connection pooling; consumers can cache locally)

## Decisions

### Decision 1: Supabase Edge Functions (Deno)

Use Supabase Edge Functions (Deno runtime) instead of a standalone API server.

**Rationale:** The data already lives in Supabase. Edge Functions run in the same infrastructure, can use the `supabase-js` server client with the service role key for unrestricted reads, and require no additional hosting. They deploy with `supabase functions deploy`.

**Alternatives considered:**
- *Standalone server (Node/Rust)*: More control, but adds hosting complexity and a separate deploy pipeline for what are simple read queries.
- *Supabase PostgREST directly*: Could work for flat table reads, but the `UnitFull` grouping logic (joining 4 tables per unit + parent fallback) is better expressed in code than in PostgREST query strings.

### Decision 2: Single function with path routing

One Edge Function `factions` at `supabase/functions/factions/index.ts` handles all three RESTful routes by parsing the URL path:
- `GET /factions` → list factions
- `GET /factions/:factionSlug` → get faction
- `GET /factions/:factionSlug/units/:unitSlug` → get unit

**Rationale:** The endpoints form a nested REST resource hierarchy (`factions → units`). A single function keeps routing coherent and avoids duplicating path-parsing logic. Supabase Edge Functions receive the full path after the function name, so sub-path routing works naturally. Shared helpers (Supabase client, CORS, parent fallback) live in `supabase/functions/_shared/`.

**Alternatives considered:**
- *Three separate functions (`factions`, `faction`, `unit`)*: Simpler per-function code, but the URL pattern `/faction?slug=X` is less RESTful and forces query params instead of path segments.

### Decision 3: Supabase client with service role key

Edge Functions SHALL use the `SUPABASE_SERVICE_ROLE_KEY` (available automatically in the Edge Function environment) to query tables, bypassing RLS.

**Rationale:** The API is read-only and all data is public (game rules, not user data). The anon key in the request header authenticates the caller; the service role key is used server-side only to avoid RLS overhead on tables that may not have read policies configured.

### Decision 4: Parent fallback in shared helper

The subfaction parent fallback logic SHALL be implemented as a shared helper that mirrors `withParentFallback` from the PWA's `db.ts`. The parent faction mapping SHALL be duplicated from `data/factions.ts` (or read from the `factions` table if a `parent_slug` column exists).

**Rationale:** The PWA already has this logic in `db.ts`. The Edge Function needs the same behavior. A shared `parentFallback` utility keeps it DRY within the Edge Functions scope. The parent mapping is small and static (derived from the faction hierarchy).

### Decision 5: Response assembles UnitFull server-side

The `/factions/:slug` and `/factions/:slug/units/:unit` routes SHALL query all relevant tables in parallel (units, base_data, unit_data, loadout_data) and assemble `UnitFull` objects server-side before returning. The faction route also includes detachments.

**Rationale:** This is the core value of the API — consumers get pre-joined data in a single request. Querying tables in parallel minimizes latency.

## Risks / Trade-offs

- **[Large response size for big factions]** → Factions like Space Marines may have 90+ units with full data. Acceptable for an API consumed by a Rust engine (not a mobile browser). If it becomes a problem, adding `?confirmed_only=true` to filter by tag is a future option.
- **[Parent mapping duplication]** → The parent faction mapping exists in the PWA's `factions.ts`. Duplicating it in the Edge Function means two places to update. → Mitigation: the mapping is small, changes rarely, and could later be moved to a `parent_slug` column in the `factions` table.
- **[No pagination]** → Returning all units in one response. → Acceptable given dataset size (~100 units max per faction, each a few KB).
