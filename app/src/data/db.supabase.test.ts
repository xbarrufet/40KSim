import 'fake-indexeddb/auto'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { StructuredAbilitiesData } from './schema'

vi.mock('./supabase', () => ({
  fetchFactions: vi.fn(async () => []),
  fetchUnitsByFaction: vi.fn(async () => []),
  fetchBaseData: vi.fn(async () => null),
  fetchUnitData: vi.fn(async () => null),
  fetchAllBaseDataByFaction: vi.fn(async () => []),
  fetchAllUnitDataByFaction: vi.fn(async () => []),
  upsertBaseData: vi.fn(async () => {}),
  upsertUnitData: vi.fn(async () => {}),
  upsertUnit: vi.fn(async () => {}),
}))

import {
  getAllFactions,
  getUnitsByFaction,
  getBaseData,
  getStructuredAbilitiesData,
  putBaseData,
  putStructuredAbilitiesData,
  putUnit,
} from './db'
import {
  fetchFactions,
  fetchUnitsByFaction,
  fetchBaseData,
  fetchUnitData,
  upsertBaseData,
  upsertUnitData,
  upsertUnit,
} from './supabase'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Supabase reads', () => {
  it('getAllFactions maps remote rows to FactionRecord', async () => {
    vi.mocked(fetchFactions).mockResolvedValueOnce([
      { slug: 'sm', name: 'Space Marines', category: 'Imperium', icon: null, unit_count: 69 },
    ])

    const result = await getAllFactions()

    expect(result).toEqual([{
      id: 'sm', slug: 'sm', name: 'Space Marines', category: 'Imperium', icon: undefined, unitCount: 69,
    }])
  })

  it('getUnitsByFaction maps remote rows to UnitRecord', async () => {
    vi.mocked(fetchUnitsByFaction).mockResolvedValueOnce([
      { faction_slug: 'sm', slug: 'ancient', name: 'Ancient', category: null, points: 40, keywords: [] },
    ])

    const result = await getUnitsByFaction('sm')

    expect(result).toEqual([{
      slug: 'ancient', name: 'Ancient', factionSlug: 'sm', category: undefined, points: 40, keywords: [],
    }])
  })

  it('getBaseData returns data from Supabase', async () => {
    vi.mocked(fetchBaseData).mockResolvedValueOnce({ slug: 'ancient', name: 'Ancient' })

    const result = await getBaseData('sm', 'ancient')

    expect(result).toEqual({ slug: 'ancient', name: 'Ancient' })
  })

  it('getBaseData returns undefined when not found', async () => {
    const result = await getBaseData('sm', 'missing')
    expect(result).toBeUndefined()
  })

  it('getStructuredAbilitiesData returns mapped data', async () => {
    vi.mocked(fetchUnitData).mockResolvedValueOnce({
      faction_slug: 'sm', unit_slug: 'ancient', tag: 'CONFIRMED',
      abilities: [{ name: 'Test', phase: 'ANY', trigger: 'ALWAYS', effects: [] }],
      raw_abilities: [{ name: 'Test', text: 'Test text', abilityType: 'unit' }],
      base_data_hash: null,
    })

    const result = await getStructuredAbilitiesData('sm', 'ancient')

    expect(result?.tag).toBe('CONFIRMED')
    expect(result?.abilities).toHaveLength(1)
  })

  it('getStructuredAbilitiesData returns undefined when not found', async () => {
    const result = await getStructuredAbilitiesData('sm', 'missing')
    expect(result).toBeUndefined()
  })
})

describe('Supabase writes', () => {
  it('putBaseData calls upsertBaseData', async () => {
    await putBaseData('sm', 'ancient', { slug: 'ancient' })
    expect(upsertBaseData).toHaveBeenCalledWith('sm', 'ancient', { slug: 'ancient' })
  })

  it('putStructuredAbilitiesData calls upsertUnitData', async () => {
    const data: StructuredAbilitiesData = { tag: 'CONFIRMED', abilities: [], rawAbilities: [] }
    await putStructuredAbilitiesData('sm', 'ancient', data)
    expect(upsertUnitData).toHaveBeenCalledWith('sm', 'ancient', data)
  })

  it('putUnit calls upsertUnit', async () => {
    await putUnit('sm', { slug: 'ancient', name: 'Ancient', factionSlug: 'sm', keywords: [] })
    expect(upsertUnit).toHaveBeenCalledWith({
      faction_slug: 'sm', slug: 'ancient', name: 'Ancient', category: null, points: null, keywords: [],
    })
  })

  it('putBaseData propagates Supabase errors', async () => {
    vi.mocked(upsertBaseData).mockRejectedValueOnce(new Error('Supabase down'))
    await expect(putBaseData('sm', 'fail', {})).rejects.toThrow('Supabase down')
  })
})
