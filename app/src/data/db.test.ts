import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'

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
  deleteList,
  getAllLists,
  getListByUrl,
  putList,
} from './db'
import type { ArmyList } from './schema'

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
