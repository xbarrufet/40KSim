import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { getStructuredAbilitiesData, getUnitsByFaction, putBaseData, putStructuredAbilitiesData, putUnit } from '../data/db'
import { seedStructuredAbilities, type BaseData } from '../data/preprocessBaseData'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')

function loadFixture(unitSlug: string): BaseData {
  const path = resolve(repoRoot, 'data', 'space-marines', 'BaseData', `${unitSlug}.json`)
  return JSON.parse(readFileSync(path, 'utf-8'))
}

// Mirrors UploadModal.handleConfirm's per-file sequence: refresh the catalogue name from
// BaseData, replace BaseData, then only seed StructuredAbilitiesData if the unit has none yet.
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

    expect(result).toEqual(confirmed)
  })
})

describe('upload flow: catalogue name refresh', () => {
  it('corrects a stale catalogue name (e.g. a file slug from before this fix) on re-upload', async () => {
    const baseData = loadFixture('ancient')
    await putUnit('space-marines', { slug: 'ancient-stale', name: 'ancient-stale', factionSlug: 'space-marines', keywords: [] })

    await uploadBaseData('space-marines', 'ancient-stale', baseData)

    const units = await getUnitsByFaction('space-marines')
    expect(units.find((u) => u.slug === 'ancient-stale')?.name).toBe('Ancient')
  })
})
