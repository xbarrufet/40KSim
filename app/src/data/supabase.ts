import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { StructuredAbilitiesData, StructuredLoadoutData } from './schema'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  if (client) return client
  if (!supabaseUrl || !supabaseAnonKey) return null
  client = createClient(supabaseUrl, supabaseAnonKey)
  return client
}

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

interface FactionRow {
  slug: string
  name: string
  category: string | null
  icon: string | null
  unit_count: number
}

interface UnitRow {
  faction_slug: string
  slug: string
  name: string
  category: string | null
  points: number | null
  keywords: string[]
}

interface UnitDataRow {
  faction_slug: string
  unit_slug: string
  tag: string
  abilities: unknown[]
  raw_abilities: unknown[]
  base_data_hash: string | null
}

export async function fetchFactions(): Promise<FactionRow[]> {
  const sb = getClient()
  if (!sb) return []
  const { data, error } = await sb.from('factions').select('*')
  if (error) throw error
  return data ?? []
}

export async function upsertFaction(faction: FactionRow): Promise<void> {
  const sb = getClient()
  if (!sb) return
  const { error } = await sb.from('factions').upsert(faction, { onConflict: 'slug' })
  if (error) throw error
}

export async function fetchUnitsByFaction(factionSlug: string): Promise<UnitRow[]> {
  const sb = getClient()
  if (!sb) return []
  const { data, error } = await sb.from('units').select('*').eq('faction_slug', factionSlug)
  if (error) throw error
  return data ?? []
}

export async function upsertUnit(unit: UnitRow): Promise<void> {
  const sb = getClient()
  if (!sb) return
  const { error } = await sb.from('units').upsert(unit, { onConflict: 'faction_slug,slug' })
  if (error) throw error
}

export async function fetchBaseData(factionSlug: string, unitSlug: string): Promise<unknown | null> {
  const sb = getClient()
  if (!sb) return null
  const { data, error } = await sb
    .from('base_data')
    .select('data')
    .eq('faction_slug', factionSlug)
    .eq('unit_slug', unitSlug)
    .maybeSingle()
  if (error) throw error
  return data?.data ?? null
}

export async function upsertBaseData(factionSlug: string, unitSlug: string, baseData: unknown): Promise<void> {
  const sb = getClient()
  if (!sb) return
  const { error } = await sb.from('base_data').upsert(
    { faction_slug: factionSlug, unit_slug: unitSlug, data: baseData },
    { onConflict: 'faction_slug,unit_slug' },
  )
  if (error) throw error
}

export async function fetchUnitData(factionSlug: string, unitSlug: string): Promise<UnitDataRow | null> {
  const sb = getClient()
  if (!sb) return null
  const { data, error } = await sb
    .from('unit_data')
    .select('*')
    .eq('faction_slug', factionSlug)
    .eq('unit_slug', unitSlug)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function upsertUnitData(factionSlug: string, unitSlug: string, unitData: StructuredAbilitiesData): Promise<void> {
  const sb = getClient()
  if (!sb) return
  const { error } = await sb.from('unit_data').upsert(
    {
      faction_slug: factionSlug,
      unit_slug: unitSlug,
      tag: unitData.tag,
      abilities: unitData.abilities as unknown[],
      raw_abilities: unitData.rawAbilities as unknown[],
      base_data_hash: unitData.baseDataHash ?? null,
    },
    { onConflict: 'faction_slug,unit_slug' },
  )
  if (error) throw error
}

export async function fetchAllBaseDataByFaction(factionSlug: string): Promise<{ unit_slug: string; data: unknown }[]> {
  const sb = getClient()
  if (!sb) return []
  const { data, error } = await sb
    .from('base_data')
    .select('unit_slug, data')
    .eq('faction_slug', factionSlug)
  if (error) throw error
  return data ?? []
}

interface LoadoutDataRow {
  faction_slug: string
  unit_slug: string
  tag: string
  options: unknown[]
}

export async function fetchLoadoutData(factionSlug: string, unitSlug: string): Promise<LoadoutDataRow | null> {
  const sb = getClient()
  if (!sb) return null
  const { data, error } = await sb
    .from('loadout_data')
    .select('*')
    .eq('faction_slug', factionSlug)
    .eq('unit_slug', unitSlug)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function upsertLoadoutData(factionSlug: string, unitSlug: string, loadoutData: StructuredLoadoutData): Promise<void> {
  const sb = getClient()
  if (!sb) return
  const { error } = await sb.from('loadout_data').upsert(
    {
      faction_slug: factionSlug,
      unit_slug: unitSlug,
      tag: loadoutData.tag,
      options: loadoutData.options as unknown[],
    },
    { onConflict: 'faction_slug,unit_slug' },
  )
  if (error) throw error
}

export async function fetchAllLoadoutDataByFaction(factionSlug: string): Promise<LoadoutDataRow[]> {
  const sb = getClient()
  if (!sb) return []
  const { data, error } = await sb
    .from('loadout_data')
    .select('*')
    .eq('faction_slug', factionSlug)
  if (error) throw error
  return data ?? []
}

export async function fetchAllUnitDataByFaction(factionSlug: string): Promise<UnitDataRow[]> {
  const sb = getClient()
  if (!sb) return []
  const { data, error } = await sb
    .from('unit_data')
    .select('*')
    .eq('faction_slug', factionSlug)
  if (error) throw error
  return data ?? []
}
