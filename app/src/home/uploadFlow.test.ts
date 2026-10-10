import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const unitStore = new Map<string, unknown>()
const baseDataStore = new Map<string, unknown>()
const unitDataStore = new Map<string, unknown>()

vi.mock('../data/supabase', () => ({
  fetchFactions: vi.fn(async () => []),
  fetchUnitsByFaction: vi.fn(async (factionSlug: string) => {
    const results: unknown[] = []
    for (const [key, value] of unitStore) {
      if (key.startsWith(factionSlug + '/')) results.push(value)
    }
    return results
  }),
  fetchBaseData: vi.fn(async (factionSlug: string, unitSlug: string) => {
    return baseDataStore.get(`${factionSlug}/${unitSlug}`) ?? null
  }),
  fetchUnitData: vi.fn(async (factionSlug: string, unitSlug: string) => {
    return unitDataStore.get(`${factionSlug}/${unitSlug}`) ?? null
  }),
  fetchAllBaseDataByFaction: vi.fn(async () => []),
  fetchAllUnitDataByFaction: vi.fn(async () => []),
  upsertBaseData: vi.fn(async (factionSlug: string, unitSlug: string, data: unknown) => {
    baseDataStore.set(`${factionSlug}/${unitSlug}`, data)
  }),
  upsertUnitData: vi.fn(async (factionSlug: string, unitSlug: string, data: Record<string, unknown>) => {
    unitDataStore.set(`${factionSlug}/${unitSlug}`, {
      faction_slug: factionSlug, unit_slug: unitSlug,
      tag: data.tag, abilities: data.abilities, raw_abilities: data.rawAbilities, base_data_hash: data.baseDataHash ?? null,
    })
  }),
  upsertUnit: vi.fn(async (unit: Record<string, unknown>) => {
    const key = `${unit.faction_slug}/${unit.slug}`
    unitStore.set(key, unit)
  }),
}))

import { getStructuredAbilitiesData, getUnitsByFaction, putBaseData, putStructuredAbilitiesData, putUnit } from '../data/db'
import { seedStructuredAbilities, type BaseData } from '../data/preprocessBaseData'

beforeEach(() => {
  unitStore.clear()
  baseDataStore.clear()
  unitDataStore.clear()
  vi.clearAllMocks()
})

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')

function loadFixture(unitSlug: string): BaseData {
  const path = resolve(repoRoot, 'data', 'space-marines', 'BaseData', `${unitSlug}.json`)
  return JSON.parse(readFileSync(path, 'utf-8'))
}

async function uploadBaseData(factionSlug: string, unitSlug: string, data: BaseData) {
  await putUnit(factionSlug, { slug: unitSlug, name: data.name, factionSlug, keywords: [] })
  await putBaseData(factionSlug, unitSlug, data)
  const existing = await getStructuredAbilitiesData(factionSlug, unitSlug)
  if (!existing) {
    await putStructuredAbilitiesData(factionSlug, unitSlug, seedStructuredAbilities(data))
  }
}

describe('upload flow: StructuredAbilitiesData generation on BaseData upload', () => {
  it('generates a PENDING StructuredAbilitiesData proposal for a brand-new unit', async () => {
    const baseData = loadFixture('ancient')
    await uploadBaseData('space-marines', 'ancient-new', baseData)

    const structuredAbilitiesData = await getStructuredAbilitiesData('space-marines', 'ancient-new')
    expect(structuredAbilitiesData?.tag).toBe('PENDING')
    expect(structuredAbilitiesData?.rawAbilities.length).toBeGreaterThan(0)
    expect(structuredAbilitiesData?.abilities).toEqual([])
  })

  it('leaves a PENDING StructuredAbilitiesData record untouched on re-upload', async () => {
    const baseData = loadFixture('ancient')
    await uploadBaseData('space-marines', 'ancient-pending', baseData)
    const first = await getStructuredAbilitiesData('space-marines', 'ancient-pending')

    await uploadBaseData('space-marines', 'ancient-pending', baseData)
    const second = await getStructuredAbilitiesData('space-marines', 'ancient-pending')

    expect(second).toEqual(first)
  })

  it('leaves a CONFIRMED StructuredAbilitiesData record untouched on re-upload', async () => {
    const baseData = loadFixture('ancient')
    await uploadBaseData('space-marines', 'ancient-confirmed', baseData)
    const pending = await getStructuredAbilitiesData('space-marines', 'ancient-confirmed')
    const confirmed = { ...pending!, tag: 'CONFIRMED' as const }
    await putStructuredAbilitiesData('space-marines', 'ancient-confirmed', confirmed)

    await uploadBaseData('space-marines', 'ancient-confirmed', baseData)
    const result = await getStructuredAbilitiesData('space-marines', 'ancient-confirmed')

    expect(result?.tag).toBe('CONFIRMED')
  })
})

describe('upload flow: catalogue name refresh', () => {
  it('corrects a stale catalogue name on re-upload', async () => {
    const baseData = loadFixture('ancient')
    await putUnit('space-marines', { slug: 'ancient-stale', name: 'ancient-stale', factionSlug: 'space-marines', keywords: [] })

    await uploadBaseData('space-marines', 'ancient-stale', baseData)

    const units = await getUnitsByFaction('space-marines')
    const found = units.find((u) => u.slug === 'ancient-stale')
    expect(found?.name).toBe('Ancient')
  })
})
