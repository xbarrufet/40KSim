import type { ArmyList, Effect, StructuredAbilitiesData, StructuredLoadoutData, UnitDataAbility, WeaponTarget } from './schema'
import { getParentFaction } from './factions'
import {
  fetchFactions as sbFetchFactions,
  fetchUnitsByFaction as sbFetchUnitsByFaction,
  fetchBaseData as sbFetchBaseData,
  fetchUnitData as sbFetchUnitData,
  fetchAllBaseDataByFaction as sbFetchAllBaseDataByFaction,
  fetchAllUnitDataByFaction as sbFetchAllUnitDataByFaction,
  upsertBaseData as sbUpsertBaseData,
  upsertUnitData as sbUpsertUnitData,
  upsertUnit as sbUpsertUnit,
  fetchLoadoutData as sbFetchLoadoutData,
  upsertLoadoutData as sbUpsertLoadoutData,
} from './supabase'

async function withParentFallback<T>(
  factionSlug: string,
  fetcher: (slug: string) => Promise<T | null>,
): Promise<{ data: T; resolvedFaction: string } | null> {
  const direct = await fetcher(factionSlug)
  if (direct) return { data: direct, resolvedFaction: factionSlug }
  const parent = getParentFaction(factionSlug)
  if (!parent) return null
  const fallback = await fetcher(parent)
  return fallback ? { data: fallback, resolvedFaction: parent } : null
}

function migrateAbility(a: Record<string, unknown>): UnitDataAbility {
  if (a.phase === 'ALL_COMBAT') a.phase = 'ANY'
  if ('effects' in a) return a as unknown as UnitDataAbility
  if (a.category === 'OTHER') return a as unknown as UnitDataAbility
  const rule = a.rule as Record<string, unknown>
  if (!rule) return a as unknown as UnitDataAbility

  const trigger = (rule.trigger as string) ?? 'ALWAYS'
  const appliedTo = (rule.appliedTo as string) ?? 'SelfModel'

  let effect: Effect
  const ruleType = rule.type as string

  const ap = appliedTo as import('./schema').AppliesTo
  if (ruleType === 'unitStatsModifier') {
    const raw_value = rule.value as string
    const num = parseFloat(raw_value?.replace('+', '') ?? '0')
    const stat = rule.stat as string
    effect = { category: 'statModifier', appliedTo: ap, stat: stat as import('./schema').UnitStat, mode: num < 0 ? 'subtract' : 'add', value: Math.abs(num) }
  } else if (ruleType === 'weaponStatsModifier') {
    const raw_value = rule.value as string
    const num = parseFloat(raw_value?.replace('+', '') ?? '0')
    const stat = rule.stat as string
    effect = { category: 'statModifier', appliedTo: ap, weaponTarget: (rule.weaponTarget as WeaponTarget) ?? 'ALL', stat: stat as import('./schema').WeaponStat, mode: num < 0 ? 'subtract' : 'add', value: Math.abs(num) }
  } else if (ruleType === 'diceModifier') {
    const modifier = rule.modifier as Record<string, unknown>
    const rollMap: Record<string, 'toHit' | 'toWound' | 'savingThrow'> = { Hit: 'toHit', Wound: 'toWound', Save: 'savingThrow' }
    const roll = rollMap[rule.throw as string] ?? 'toHit'
    if (modifier?.kind === 'reroll') {
      effect = { category: 'diceModifier', appliedTo: ap, roll, action: modifier.reroll === 'ALL' ? 'rerollAll' : 'rerollOnes' }
    } else {
      const val = parseFloat((modifier?.value as string)?.replace('+', '') ?? '0')
      effect = { category: 'diceModifier', appliedTo: ap, roll, action: val < 0 ? 'subtractFromRoll' : 'addToRoll' }
    }
  } else {
    effect = { category: 'weaponKeyword', appliedTo: ap, weaponTarget: (rule.weaponTarget as WeaponTarget) ?? 'ALL', keyword: rule.attribute as import('./weaponKeywords').KnownAttribute, value: (rule.value as string) ?? null }
  }

  return {
    name: (a.name as string) ?? '',
    phase: 'ANY',
    trigger,
    effects: [effect],
  }
}

// ---------------------------------------------------------------------------
// IDB — only used for army lists (personal data)
// ---------------------------------------------------------------------------

const DB_NAME = '40ksim'
const DB_VERSION = 3

let dbPromise: Promise<IDBDatabase> | null = null

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('lists')) {
        db.createObjectStore('lists')
      }
      for (const name of ['factions', 'units', 'baseData', 'unitData']) {
        if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

function tx(db: IDBDatabase, stores: string | string[], mode: IDBTransactionMode) {
  return db.transaction(stores, mode)
}

export async function getAllLists(): Promise<ArmyList[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'lists', 'readonly')
    const request = t.objectStore('lists').getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getListByUrl(listUrl: string): Promise<ArmyList | undefined> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'lists', 'readonly')
    const request = t.objectStore('lists').getAll()
    request.onsuccess = () => {
      const lists = request.result as ArmyList[]
      resolve(lists.find((list) => list.listUrl === listUrl))
    }
    request.onerror = () => reject(request.error)
  })
}

export async function putList(list: ArmyList): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'lists', 'readwrite')
    const request = t.objectStore('lists').put(list, list.id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteList(id: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const t = tx(db, 'lists', 'readwrite')
    const request = t.objectStore('lists').delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ---------------------------------------------------------------------------
// Shared data — Supabase direct
// ---------------------------------------------------------------------------

interface FactionRecord {
  id: string
  slug: string
  name: string
  category?: string
  icon?: string
  unitCount: number
}

interface UnitRecord {
  slug: string
  name: string
  factionSlug: string
  category?: string
  points?: number
  keywords: string[]
}

function remoteToStructuredAbilitiesData(remote: { tag: string; abilities: UnitDataAbility[]; raw_abilities: StructuredAbilitiesData['rawAbilities']; base_data_hash: string | null }): StructuredAbilitiesData {
  return {
    tag: remote.tag as StructuredAbilitiesData['tag'],
    abilities: remote.abilities.map(a => migrateAbility(a as unknown as Record<string, unknown>)),
    rawAbilities: remote.raw_abilities,
    baseDataHash: remote.base_data_hash ?? undefined,
  }
}

function mapFactionRow(f: { slug: string; name: string; category: string | null; icon: string | null; unit_count: number }): FactionRecord {
  return { id: f.slug, slug: f.slug, name: f.name, category: f.category ?? undefined, icon: f.icon ?? undefined, unitCount: f.unit_count }
}

export async function getAllFactions(): Promise<FactionRecord[]> {
  const remote = await sbFetchFactions()
  return remote.map(mapFactionRow).filter(f => f.unitCount > 0)
}

export async function getAllFactionsUnfiltered(): Promise<FactionRecord[]> {
  const remote = await sbFetchFactions()
  return remote.map(mapFactionRow)
}

export async function getFactionsWithoutUnits(): Promise<FactionRecord[]> {
  const remote = await sbFetchFactions()
  return remote.map(mapFactionRow).filter(f => f.unitCount === 0).sort((a, b) => a.name.localeCompare(b.name))
}

export async function isFactionsEmpty(): Promise<boolean> {
  const factions = await sbFetchFactions()
  return factions.length === 0
}

export async function getUnitsByFaction(factionSlug: string): Promise<UnitRecord[]> {
  const remote = await sbFetchUnitsByFaction(factionSlug)
  return remote.map(u => ({
    slug: u.slug,
    name: u.name,
    factionSlug: u.faction_slug,
    category: u.category ?? undefined,
    points: u.points ?? undefined,
    keywords: u.keywords,
  }))
}

export async function getBaseDataUnitsByFaction(factionSlug: string): Promise<{ slug: string; name: string }[]> {
  const remote = await sbFetchAllBaseDataByFaction(factionSlug)
  return remote.map(r => {
    const data = r.data as { slug: string; name: string }
    return { slug: data.slug, name: data.name }
  })
}

export async function getBaseData(factionSlug: string, unitSlug: string): Promise<unknown> {
  const result = await withParentFallback(factionSlug, slug => sbFetchBaseData(slug, unitSlug))
  return result?.data ?? undefined
}

export async function hasBaseData(factionSlug: string, unitSlug: string): Promise<boolean> {
  return (await withParentFallback(factionSlug, slug => sbFetchBaseData(slug, unitSlug))) != null
}

export async function hasStructuredAbilitiesData(factionSlug: string, unitSlug: string): Promise<boolean> {
  return (await withParentFallback(factionSlug, slug => sbFetchUnitData(slug, unitSlug))) != null
}

export type UnitStatus = 'red' | 'amber' | 'green'

export async function getUnitStatuses(factionSlug: string, unitSlugs: string[]): Promise<Map<string, UnitStatus>> {
  const parent = getParentFaction(factionSlug)
  const fetches: Promise<{ unit_slug: string; tag: string }[]>[] = [sbFetchAllUnitDataByFaction(factionSlug)]
  if (parent) fetches.push(sbFetchAllUnitDataByFaction(parent))
  const [ownData, parentData] = await Promise.all(fetches)

  const tagMap = new Map<string, string>()
  if (parentData) {
    for (const r of parentData) tagMap.set(r.unit_slug, r.tag)
  }
  for (const r of ownData) tagMap.set(r.unit_slug, r.tag)

  const result = new Map<string, UnitStatus>()
  for (const slug of unitSlugs) {
    const tag = tagMap.get(slug)
    result.set(slug, tag === 'CONFIRMED' ? 'green' : tag === 'AI_PROPOSED' ? 'amber' : 'red')
  }
  return result
}

export async function getStructuredAbilitiesData(factionSlug: string, unitSlug: string): Promise<{ data: StructuredAbilitiesData; resolvedFaction: string } | undefined> {
  const result = await withParentFallback(factionSlug, slug => sbFetchUnitData(slug, unitSlug))
  if (!result) return undefined
  return { data: remoteToStructuredAbilitiesData(result.data), resolvedFaction: result.resolvedFaction }
}

export async function putBaseData(factionSlug: string, unitSlug: string, data: Record<string, unknown>): Promise<void> {
  await sbUpsertBaseData(factionSlug, unitSlug, data)
}

export async function putStructuredAbilitiesData(factionSlug: string, unitSlug: string, data: StructuredAbilitiesData): Promise<void> {
  await sbUpsertUnitData(factionSlug, unitSlug, data)
}

export async function putUnit(factionSlug: string, unit: UnitRecord): Promise<void> {
  await sbUpsertUnit({
    faction_slug: factionSlug,
    slug: unit.slug,
    name: unit.name,
    category: unit.category ?? null,
    points: unit.points ?? null,
    keywords: unit.keywords,
  })
}

export async function syncUnitCatalog(
  factionSlug: string,
  catalogUnits: Array<{ slug: string; name: string; category?: string; points?: number }>,
): Promise<{ added: number; updated: number }> {
  const existing = await getUnitsByFaction(factionSlug)
  const bySlug = new Map(existing.map(u => [u.slug, u]))
  let added = 0
  let updated = 0

  for (const unit of catalogUnits) {
    const prev = bySlug.get(unit.slug)
    const record: UnitRecord = prev
      ? { ...prev, name: unit.name, category: unit.category, points: unit.points }
      : { slug: unit.slug, name: unit.name, factionSlug, category: unit.category, points: unit.points, keywords: [] }
    if (prev) updated++; else added++
    await putUnit(factionSlug, record)
  }

  return { added, updated }
}

export async function getBaseDataCount(factionSlug: string): Promise<number> {
  const remote = await sbFetchAllBaseDataByFaction(factionSlug)
  return remote.length
}

export async function getConfirmedUnitDataCount(factionSlug: string): Promise<number> {
  const remote = await sbFetchAllUnitDataByFaction(factionSlug)
  return remote.filter(r => r.tag === 'CONFIRMED').length
}

export async function getLoadoutData(factionSlug: string, unitSlug: string): Promise<{ data: StructuredLoadoutData; resolvedFaction: string } | undefined> {
  const result = await withParentFallback(factionSlug, slug => sbFetchLoadoutData(slug, unitSlug))
  if (!result) return undefined
  const remote = result.data
  return { data: { tag: remote.tag as StructuredLoadoutData['tag'], options: remote.options }, resolvedFaction: result.resolvedFaction }
}

export async function putLoadoutData(factionSlug: string, unitSlug: string, data: StructuredLoadoutData): Promise<void> {
  await sbUpsertLoadoutData(factionSlug, unitSlug, data)
}
