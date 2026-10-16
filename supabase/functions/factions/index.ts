import { handleOptions, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'
import {
  fetchFactions,
  fetchFactionBySlug,
  fetchUnitsByFaction,
  fetchAllBaseDataByFaction,
  fetchAllUnitDataByFaction,
  fetchAllLoadoutDataByFaction,
  fetchAllDetachmentDataByFaction,
  fetchUnitBySlug,
  fetchBaseData,
  fetchUnitData,
  fetchLoadoutData,
  withParentFallback,
} from '../_shared/queries.ts'
import { buildUnitFull } from '../_shared/unitFull.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    const url = new URL(req.url)
    const pathAfterFunction = url.pathname.replace(/^\/factions\/?/, '')
    const segments = pathAfterFunction.split('/').filter(Boolean)

    const sb = getSupabaseClient()

    // GET /factions
    if (segments.length === 0) {
      return await handleListFactions(sb)
    }

    const factionSlug = segments[0]

    // GET /factions/:factionSlug
    if (segments.length === 1) {
      return await handleGetFaction(sb, factionSlug)
    }

    // GET /factions/:factionSlug/units/:unitSlug
    if (segments.length === 3 && segments[1] === 'units') {
      const unitSlug = segments[2]
      return await handleGetUnit(sb, factionSlug, unitSlug)
    }

    return errorResponse('Not found', 404)
  } catch (err) {
    console.error(err)
    return errorResponse('Internal server error', 500)
  }
})

async function handleListFactions(sb: ReturnType<typeof getSupabaseClient>) {
  const rows = await fetchFactions(sb)
  const factions = rows
    .filter((f) => f.unit_count > 0)
    .map((f) => ({
      slug: f.slug,
      name: f.name,
      category: f.category,
      icon: f.icon,
      unitCount: f.unit_count,
    }))
  return jsonResponse({ factions })
}

async function handleGetFaction(sb: ReturnType<typeof getSupabaseClient>, factionSlug: string) {
  const faction = await fetchFactionBySlug(sb, factionSlug)
  if (!faction) return errorResponse('Faction not found', 404)

  const [unitRows, allBaseData, allUnitData, allLoadoutData, detachmentRows] = await Promise.all([
    fetchUnitsByFaction(sb, factionSlug),
    fetchAllBaseDataByFaction(sb, factionSlug),
    fetchAllUnitDataByFaction(sb, factionSlug),
    fetchAllLoadoutDataByFaction(sb, factionSlug),
    fetchAllDetachmentDataByFaction(sb, factionSlug),
  ])

  const baseDataMap = new Map(allBaseData.map((b) => [b.unit_slug, b.data]))
  const unitDataMap = new Map(allUnitData.map((u) => [u.unit_slug, u]))
  const loadoutMap = new Map(allLoadoutData.map((l) => [l.unit_slug, l]))

  const units = unitRows.map((unit) =>
    buildUnitFull(
      unit,
      baseDataMap.get(unit.slug) ?? null,
      unitDataMap.get(unit.slug) ?? null,
      loadoutMap.get(unit.slug) ?? null,
    ),
  )

  const detachments = detachmentRows.map((d) => ({
    detachmentSlug: d.detachment_slug,
    tag: d.tag,
    data: d.data,
    enhancements: d.enhancements,
  }))

  return jsonResponse({ factionSlug, units, detachments })
}

async function handleGetUnit(
  sb: ReturnType<typeof getSupabaseClient>,
  factionSlug: string,
  unitSlug: string,
) {
  const unit = await fetchUnitBySlug(sb, factionSlug, unitSlug)
  if (!unit) return errorResponse('Unit not found', 404)

  const [baseData, unitData, loadoutData] = await Promise.all([
    withParentFallback(factionSlug, (slug) => fetchBaseData(sb, slug, unitSlug)),
    withParentFallback(factionSlug, (slug) => fetchUnitData(sb, slug, unitSlug)),
    withParentFallback(factionSlug, (slug) => fetchLoadoutData(sb, slug, unitSlug)),
  ])

  const unitFull = buildUnitFull(unit, baseData, unitData, loadoutData)
  return jsonResponse({ factionSlug, unit: unitFull })
}
