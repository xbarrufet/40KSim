import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  deleteList,
  getAllLists,
  getBaseDataUnitsByFaction,
  getListByUrl,
  getStructuredAbilitiesData,
  getUnitStatuses,
  putBaseData,
  putList,
  putStructuredAbilitiesData,
} from './db'
import type { ArmyList, StructuredAbilitiesData } from './schema'

function sampleStructuredAbilitiesData(overrides: Partial<StructuredAbilitiesData> = {}): StructuredAbilitiesData {
  return {
    tag: 'PENDING',
    abilities: [],
    rawAbilities: [],
    ...overrides,
  }
}

describe('unitData store', () => {
  it('round-trips a StructuredAbilitiesData record', async () => {
    const structuredAbilitiesData = sampleStructuredAbilitiesData()

    await putStructuredAbilitiesData('test-faction', 'test-unit', structuredAbilitiesData)
    const result = await getStructuredAbilitiesData('test-faction', 'test-unit')

    expect(result).toEqual(structuredAbilitiesData)
  })

  it('returns undefined for a unit with no StructuredAbilitiesData record', async () => {
    const result = await getStructuredAbilitiesData('test-faction', 'never-uploaded')
    expect(result).toBeUndefined()
  })

  it('overwrites the previous record on a second put', async () => {
    await putStructuredAbilitiesData('test-faction', 'confirmed-unit', sampleStructuredAbilitiesData({ tag: 'PENDING' }))
    await putStructuredAbilitiesData('test-faction', 'confirmed-unit', sampleStructuredAbilitiesData({ tag: 'CONFIRMED' }))

    const result = await getStructuredAbilitiesData('test-faction', 'confirmed-unit')
    expect(result?.tag).toBe('CONFIRMED')
  })
})

describe('getUnitStatuses', () => {
  it('maps missing, PENDING, and CONFIRMED StructuredAbilitiesData to the 2-state light', async () => {
    await putStructuredAbilitiesData('status-faction', 'pending-unit', sampleStructuredAbilitiesData({ tag: 'PENDING' }))
    await putStructuredAbilitiesData('status-faction', 'confirmed-unit', sampleStructuredAbilitiesData({ tag: 'CONFIRMED' }))

    const statuses = await getUnitStatuses('status-faction', ['no-data-unit', 'pending-unit', 'confirmed-unit'])

    expect(statuses.get('no-data-unit')).toBe('red')
    expect(statuses.get('pending-unit')).toBe('red')
    expect(statuses.get('confirmed-unit')).toBe('green')
  })
})

describe('getBaseDataUnitsByFaction', () => {
  it('returns only the slug/name pairs for BaseData uploaded under the given faction', async () => {
    await putBaseData('faction-a', 'unit-one', { id: 1, slug: 'unit-one', name: 'Unit One', abilities: [], miniatures: [] })
    await putBaseData('faction-a', 'unit-two', { id: 2, slug: 'unit-two', name: 'Unit Two', abilities: [], miniatures: [] })
    await putBaseData('faction-b', 'unit-three', { id: 3, slug: 'unit-three', name: 'Unit Three', abilities: [], miniatures: [] })

    const results = await getBaseDataUnitsByFaction('faction-a')

    expect(results.sort((a, b) => a.slug.localeCompare(b.slug))).toEqual([
      { slug: 'unit-one', name: 'Unit One' },
      { slug: 'unit-two', name: 'Unit Two' },
    ])
  })

  it('returns an empty array when the faction has no BaseData uploaded', async () => {
    const results = await getBaseDataUnitsByFaction('empty-faction')
    expect(results).toEqual([])
  })
})

function sampleList(overrides: Partial<ArmyList> = {}): ArmyList {
  return {
    id: 'list-1',
    title: '# 04-10',
    factionSlug: 'imperial-fists',
    entries: [],
    ...overrides,
  }
}

describe('lists store', () => {
  it('round-trips an ArmyList record', async () => {
    const list = sampleList({ id: 'round-trip-list' })

    await putList(list)
    const all = await getAllLists()

    expect(all.find((l) => l.id === 'round-trip-list')).toEqual(list)
  })

  it('getListByUrl finds a stored list by its listUrl', async () => {
    const list = sampleList({ id: 'url-list', listUrl: 'https://www.40k.app/lists/KsM8Gd9KU9' })
    await putList(list)

    const found = await getListByUrl('https://www.40k.app/lists/KsM8Gd9KU9')
    expect(found).toEqual(list)
  })

  it('getListByUrl returns undefined when no list matches', async () => {
    const found = await getListByUrl('https://www.40k.app/lists/does-not-exist')
    expect(found).toBeUndefined()
  })

  it('deleteList removes the record', async () => {
    const list = sampleList({ id: 'deletable-list' })
    await putList(list)

    await deleteList('deletable-list')

    const all = await getAllLists()
    expect(all.find((l) => l.id === 'deletable-list')).toBeUndefined()
  })
})
