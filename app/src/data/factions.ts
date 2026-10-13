import { fetchBaseData } from './supabase'

const PARENT_FACTION: Record<string, string> = {
  'black-templars': 'space-marines',
  'blood-angels': 'space-marines',
  'dark-angels': 'space-marines',
  'deathwatch': 'space-marines',
  'imperial-fists': 'space-marines',
  'iron-hands': 'space-marines',
  'raven-guard': 'space-marines',
  'salamanders': 'space-marines',
  'space-wolves': 'space-marines',
  'ultramarines': 'space-marines',
  'white-scars': 'space-marines',
}

export function getParentFaction(slug: string): string | undefined {
  return PARENT_FACTION[slug]
}

export async function resolveDataFaction(factionSlug: string, unitSlug: string): Promise<string> {
  const parent = PARENT_FACTION[factionSlug]
  if (!parent) return factionSlug
  const ownData = await fetchBaseData(factionSlug, unitSlug)
  if (ownData != null) return factionSlug
  return parent
}
