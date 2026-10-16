# Tasks

## 1. Project scaffolding

- [x] 1.1 Initialize Supabase Edge Functions directory structure: create `supabase/functions/factions/index.ts` and `supabase/functions/_shared/`. Verify directories and files exist with `ls -R supabase/functions/`.
- [x] 1.2 Create `supabase/functions/_shared/cors.ts` with a `corsHeaders` object (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: authorization, content-type`) and an `OPTIONS` handler helper. Verify by importing in a scratch file without errors.
- [x] 1.3 Create `supabase/functions/_shared/supabase.ts` that initializes a Supabase client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `Deno.env`. Verify the module exports a working client function.

## 2. Parent fallback and UnitFull assembly

- [x] 2.1 Create `supabase/functions/_shared/parents.ts` with the `PARENT_FACTION` mapping (mirroring `app/src/data/factions.ts`) and a `getParentFaction(slug)` function. Verify the mapping covers all 11 Space Marines subfactions.
- [x] 2.2 Create `supabase/functions/_shared/unitFull.ts` with a `buildUnitFull` function that takes a unit row, base data, unit data, and loadout data, and returns a `UnitFull` object (with `null` for missing data). Verify by calling with partial data and checking the output shape.
- [x] 2.3 Create `supabase/functions/_shared/queries.ts` with shared query functions: `fetchUnitsByFaction`, `fetchAllBaseDataByFaction`, `fetchAllUnitDataByFaction`, `fetchAllLoadoutDataByFaction`, `fetchAllDetachmentDataByFaction`, `fetchBaseData`, `fetchUnitData`, `fetchLoadoutData` — each taking the Supabase client and returning typed results. Include a `withParentFallback` helper that checks the faction first, then falls back to the parent. Verify each function's return type matches the expected shape.

## 3. Single Edge Function with path routing

- [x] 3.1 Implement `supabase/functions/factions/index.ts` with path routing: parse the URL path after `/factions` to determine the route. `GET /factions` lists factions (filter `unit_count > 0`, map to `FactionSummary[]`). `GET /factions/:factionSlug` returns full faction data (units as `UnitFull[]` + detachments). `GET /factions/:factionSlug/units/:unitSlug` returns a single `UnitFull`. Handle `OPTIONS` for CORS on all routes. Verify by deploying locally with `supabase functions serve` and calling all three routes with curl:
  - `curl http://localhost:54321/functions/v1/factions`
  - `curl http://localhost:54321/functions/v1/factions/space-marines`
  - `curl http://localhost:54321/functions/v1/factions/space-marines/units/intercessor-squad`
- [x] 3.2 Verify error cases: nonexistent faction returns 404; nonexistent unit returns 404; unrecognized path pattern returns 404.
- [x] 3.3 Verify subfaction parent fallback: `GET /factions/blood-angels/units/intercessor-squad` returns abilities inherited from `space-marines` when not present under `blood-angels`.

## 4. Integration verification

- [x] 4.1 Deploy the function to the Supabase project with `supabase functions deploy factions` and verify each route returns correct responses against production data. Verify the `docs/api-spec.md` matches the actual response shapes returned by the deployed function.

## Workflow follow-up

- Archive the change after the endpoint is deployed and verified.
