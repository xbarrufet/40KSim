import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { getUnitData, putBaseData, putUnitData } from '../data/db'
import { preprocessBaseData, type BaseData } from '../data/preprocessBaseData'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')

function loadFixture(unitSlug: string): BaseData {
  const path = resolve(repoRoot, 'data', 'space-marines', 'BaseData', `${unitSlug}.json`)
  return JSON.parse(readFileSync(path, 'utf-8'))
}

// Mirrors UploadModal.handleConfirm's per-file sequence: replace BaseData, then
// only preprocess into UnitData if the unit has none yet.
async function uploadBaseData(factionSlug: string, unitSlug: string, data: BaseData) {
  await putBaseData(factionSlug, unitSlug, data)
  const existingUnitData = await getUnitData(factionSlug, unitSlug)
  if (!existingUnitData) {
    await putUnitData(factionSlug, unitSlug, preprocessBaseData(data))
  }
}

describe('upload flow: UnitData generation on BaseData upload', () => {
  it('generates a PENDING UnitData proposal for a brand-new unit', async () => {
    const baseData = loadFixture('ancient')
    await uploadBaseData('space-marines', 'ancient-new', baseData)

    const unitData = await getUnitData('space-marines', 'ancient-new')
    expect(unitData?.tag).toBe('PENDING')
    expect(unitData?.name).toBe('Ancient')
  })

  it('leaves a PENDING UnitData record untouched on re-upload', async () => {
    const baseData = loadFixture('ancient')
    await uploadBaseData('space-marines', 'ancient-pending', baseData)
    const firstUnitData = await getUnitData('space-marines', 'ancient-pending')

    await uploadBaseData('space-marines', 'ancient-pending', baseData)
    const secondUnitData = await getUnitData('space-marines', 'ancient-pending')

    expect(secondUnitData).toEqual(firstUnitData)
  })

  it('leaves a CONFIRMED UnitData record untouched on re-upload', async () => {
    const baseData = loadFixture('ancient')
    await uploadBaseData('space-marines', 'ancient-confirmed', baseData)
    const pendingUnitData = await getUnitData('space-marines', 'ancient-confirmed')
    const confirmedUnitData = { ...pendingUnitData!, tag: 'CONFIRMED' as const }
    await putUnitData('space-marines', 'ancient-confirmed', confirmedUnitData)

    await uploadBaseData('space-marines', 'ancient-confirmed', baseData)
    const result = await getUnitData('space-marines', 'ancient-confirmed')

    expect(result).toEqual(confirmedUnitData)
  })
})
