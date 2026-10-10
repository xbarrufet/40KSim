# Design

## Context

See proposal.md — Why. The app currently stores all data in IndexedDB with no backend. The data layer (`db.ts`, ~400 lines) exposes ~30 functions that components import directly. The init flow (`loadCatalog.ts`) fetches a static `units.json` and seeds IndexedDB on first launch.

Key constraints:
- PWA designed for offline use — reads must work without network
- No auth, no RLS — all data is public read/write for now
- The `db.ts` API surface is consumed by 8+ files (HomeView components, list parsing, tests)
- BaseData is stored as opaque JSONB blobs (~30 KB each); StructuredAbilitiesData has a `tag` field used for filtering

## Goals / Non-Goals

**Goals:**
- Shared data persists across browser resets and devices
- Reads remain fast (IndexedDB cache, no network waterfall on render)
- Write failures are surfaced to the user — no silent data loss
- Existing component code changes minimally (same function signatures from `db.ts`)

**Non-Goals:**
- User authentication or per-user data isolation (future change)
- Real-time subscriptions or live sync between tabs/devices
- Migrating army lists to Supabase (they stay local)
- Conflict resolution — single-writer model, last write wins

## Decisions

### 1. Supabase JS client over raw REST

**Choice**: Use `@supabase/supabase-js` rather than calling the PostgREST API directly.

**Why**: The JS client handles auth headers, retries, and provides typed query builders. Since we'll eventually add auth, starting with the client avoids a rewrite later.

**Alternative**: Raw `fetch` to the REST API — lighter dependency, but loses typed queries and future auth integration.

### 2. Data access architecture: wrapper layer in db.ts

**Choice**: Keep `db.ts` as the single import point for all components. Internally, shared-data functions call a new `supabase.ts` module for writes and background revalidation, while still reading from IndexedDB for the immediate return.

```
Components ──> db.ts (same API)
                ├── IndexedDB (immediate reads, cache writes)
                └── supabase.ts (remote writes, background revalidation)
```

**Why**: Components don't need to know about Supabase. The refactor stays internal to the data layer. Tests can mock at the `supabase.ts` boundary.

**Alternative**: New `dataService.ts` that replaces `db.ts` entirely — cleaner separation but forces every import site to change.

### 3. Stale-while-revalidate for reads

**Choice**: Read functions return IndexedDB data immediately and trigger a background Supabase fetch. When the remote data arrives and differs, update IndexedDB. The component is NOT re-rendered on revalidation — the updated data appears on next access.

**Why**: Keeps the app feeling instant. The data changes infrequently (manual uploads/confirmations), so staleness is rarely noticeable.

**Alternative**: Always-fetch with loading states — adds latency and loading spinners to every screen transition.

### 4. Supabase-first writes with no offline queue

**Choice**: Writes go to Supabase first. On success, update IndexedDB. On failure, reject the operation and show an error. No offline write queue.

**Why**: The write operations (BaseData upload, confirm abilities, import proposals) are deliberate user actions, not background operations. Failing explicitly is better than silently queuing writes that may conflict or be lost. Offline write support can be added later with auth.

**Alternative**: Write to IndexedDB first, sync to Supabase in background — introduces conflict potential and complexity without auth to resolve ownership.

### 5. Fallback mode when Supabase is not configured

**Choice**: When `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing, the app operates in IndexedDB-only mode (current behavior). This keeps local development simple and avoids breaking the app if env vars are misconfigured.

**Why**: The app should degrade gracefully. Developers can run without Supabase for local testing.

### 6. Supabase schema: JSONB for BaseData and abilities

**Choice**: Store `base_data.data`, `unit_data.abilities`, and `unit_data.raw_abilities` as JSONB columns rather than normalizing into relational tables.

**Why**: BaseData structure varies by unit and is never queried partially — it's fetched whole. Same for abilities. The `tag` column is the only field we filter on, and it's a top-level column. JSONB avoids a complex relational schema for data that's treated as documents.

**Alternative**: Normalize weapons, abilities, models into separate tables — more SQL-friendly queries but massive schema complexity for no query benefit.

## Risks / Trade-offs

**[No auth = public write access]** → Any client with the anon key can write to all tables. Acceptable for now since this is a personal/small-group tool. Mitigation: add Supabase Auth + RLS in a future change.

**[No offline writes]** → Users cannot upload BaseData or confirm abilities without network. Mitigation: these are deliberate, infrequent actions. The app clearly communicates the error. Offline read continues to work.

**[Stale reads after external writes]** → If data is updated in Supabase (e.g., by another device), the current device won't see it until the next background revalidation. Mitigation: revalidation happens on each screen load, so staleness is bounded to the current session's view lifetime.

**[JSONB column size]** → BaseData blobs are ~30 KB each. With ~70 units per faction and ~30 factions, total base_data storage is ~60 MB. Well within Supabase free tier (500 MB database). No concern at current scale.

## Migration Plan

1. Create tables in Supabase (SQL migration script)
2. Seed Supabase with existing data from `data/space-marines/BaseData/*.json` and any existing structured abilities
3. Add `@supabase/supabase-js` dependency and `supabase.ts` module
4. Refactor `db.ts` write functions to go through Supabase first
5. Refactor `db.ts` read functions to add background revalidation
6. Replace `loadCatalog.ts` init flow to fetch from Supabase
7. Update `.env` with Supabase credentials
8. Verify: upload BaseData, confirm abilities, check persistence across browser reset
