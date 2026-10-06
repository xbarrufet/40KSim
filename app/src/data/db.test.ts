import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { deleteList, getAllLists, getListByUrl, getUnitData, getUnitStatuses, putList, putUnitData } from './db'
import type { ArmyList, UnitData } from './schema'

function sampleUnitData(overrides: Partial<UnitData> = {}): UnitData {
  return {
    tag: 'PENDING',
    id: 1,
    slug: 'test-unit',
    name: 'Test Unit',
    keywords: ['INFANTRY'],
    stats: {
      movement: 6,
      toughness: 4,
      save: 3,
      invulnerableSave: null,
      wounds: 2,
      leadership: 7,
      objectiveControl: 1,
    },
    wargear: [],
    abilities: [],
    rawAbilities: [],
    ...overrides,
  }
}

describe('unitData store', () => {
  it('round-trips a UnitData record', async () => {
    const unitData = sampleUnitData()

    await putUnitData('test-faction', 'test-unit', unitData)
    const result = await getUnitData('test-faction', 'test-unit')

    expect(result).toEqual(unitData)
  })

  it('returns undefined for a unit with no UnitData record', async () => {
    const result = await getUnitData('test-faction', 'never-uploaded')
    expect(result).toBeUndefined()
  })

  it('overwrites the previous record on a second put', async () => {
    await putUnitData('test-faction', 'confirmed-unit', sampleUnitData({ tag: 'PENDING' }))
    await putUnitData('test-faction', 'confirmed-unit', sampleUnitData({ tag: 'CONFIRMED' }))

    const result = await getUnitData('test-faction', 'confirmed-unit')
    expect(result?.tag).toBe('CONFIRMED')
  })
})

describe('getUnitStatuses', () => {
  it('maps missing, PENDING, and CONFIRMED UnitData to the 2-state light', async () => {
    await putUnitData('status-faction', 'pending-unit', sampleUnitData({ slug: 'pending-unit', tag: 'PENDING' }))
    await putUnitData('status-faction', 'confirmed-unit', sampleUnitData({ slug: 'confirmed-unit', tag: 'CONFIRMED' }))

    const statuses = await getUnitStatuses('status-faction', ['no-data-unit', 'pending-unit', 'confirmed-unit'])

    expect(statuses.get('no-data-unit')).toBe('red')
    expect(statuses.get('pending-unit')).toBe('red')
    expect(statuses.get('confirmed-unit')).toBe('green')
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
