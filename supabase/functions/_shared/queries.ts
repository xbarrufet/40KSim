import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { UnitRow, UnitDataRow, LoadoutDataRow } from './unitFull.ts'
import { getParentFaction } from './parents.ts'

export interface FactionRow {
  slug: string
  name: string
  category: string | null
  icon: string | null
  unit_count: number
}

export interface DetachmentDataRow {
  detachment_slug: string
  tag: string
  data: Record<string, unknown>
  enhancements: unknown[] | null
}

export async function fetchFactions(sb: SupabaseClient): Promise<FactionRow[]> {
  const { data, error } = await sb.from('factions').select('slug, name, category, icon, unit_count')
  if (error) throw error
  return data ?? []
}

export async function fetchFactionBySlug(sb: SupabaseClient, slug: string): Promise<FactionRow | null> {
  const { data, error } = await sb
    .from('factions')
    .select('slug, name, category, icon, unit_count')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchUnitsByFaction(sb: SupabaseClient, factionSlug: string): Promise<UnitRow[]> {
  const { data, error } = await sb.from('units').select('*').eq('faction_slug', factionSlug)
  if (error) throw error
  return data ?? []
}

export async function fetchAllBaseDataByFaction(
  sb: SupabaseClient,
  factionSlug: string,
): Promise<{ unit_slug: string; data: Record<string, unknown> }[]> {
  const { data, error } = await sb
    .from('base_data')
    .select('unit_slug, data')
    .eq('faction_slug', factionSlug)
  if (error) throw error
  return data ?? []
}

export async function fetchAllUnitDataByFaction(
  sb: SupabaseClient,
  factionSlug: string,
): Promise<(UnitDataRow & { unit_slug: string })[]> {
  const { data, error } = await sb
    .from('unit_data')
    .select('unit_slug, tag, abilities, raw_abilities, base_data_hash')
    .eq('faction_slug', factionSlug)
  if (error) throw error
  return data ?? []
}

export async function fetchAllLoadoutDataByFaction(
  sb: SupabaseClient,
  factionSlug: string,
): Promise<(LoadoutDataRow & { unit_slug: string })[]> {
  const { data, error } = await sb
    .from('loadout_data')
    .select('unit_slug, tag, options')
    .eq('faction_slug', factionSlug)
  if (error) throw error
  return data ?? []
}

export async function fetchAllDetachmentDataByFaction(
  sb: SupabaseClient,
  factionSlug: string,
): Promise<DetachmentDataRow[]> {
  const { data, error } = await sb
    .from('detachment_data')
    .select('detachment_slug, tag, data, enhancements')
    .eq('faction_slug', factionSlug)
  if (error) throw error
  return data ?? []
}

export async function fetchBaseData(
  sb: SupabaseClient,
  factionSlug: string,
  unitSlug: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await sb
    .from('base_data')
    .select('data')
    .eq('faction_slug', factionSlug)
    .eq('unit_slug', unitSlug)
    .maybeSingle()
  if (error) throw error
  return data?.data ?? null
}

export async function fetchUnitData(
  sb: SupabaseClient,
  factionSlug: string,
  unitSlug: string,
): Promise<UnitDataRow | null> {
  const { data, error } = await sb
    .from('unit_data')
    .select('tag, abilities, raw_abilities, base_data_hash')
    .eq('faction_slug', factionSlug)
    .eq('unit_slug', unitSlug)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function fetchLoadoutData(
  sb: SupabaseClient,
  factionSlug: string,
  unitSlug: string,
): Promise<LoadoutDataRow | null> {
  const { data, error } = await sb
    .from('loadout_data')
    .select('tag, options')
    .eq('faction_slug', factionSlug)
    .eq('unit_slug', unitSlug)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function withParentFallback<T>(
  factionSlug: string,
  fetcher: (slug: string) => Promise<T | null>,
): Promise<T | null> {
  const direct = await fetcher(factionSlug)
  if (direct) return direct
  const parent = getParentFaction(factionSlug)
  if (!parent) return null
  return fetcher(parent)
}

export async function fetchUnitBySlug(
  sb: SupabaseClient,
  factionSlug: string,
  unitSlug: string,
): Promise<UnitRow | null> {
  const { data, error } = await sb
    .from('units')
    .select('*')
    .eq('faction_slug', factionSlug)
    .eq('slug', unitSlug)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}
