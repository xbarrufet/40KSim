import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { extractDatasheetContext, preprocessBaseData, type BaseData } from './preprocessBaseData'
import type { RawAbility, WargearEntry, WeaponProfileData } from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')

function loadFixture(faction: string, unitSlug: string): BaseData {
  const path = resolve(repoRoot, 'data', faction, 'BaseData', `${unitSlug}.json`)
  return JSON.parse(readFileSync(path, 'utf-8'))
}

describe('preprocessBaseData', () => {
  it('builds UnitData for a single-miniature datasheet (ancient)', () => {
    const unitData = preprocessBaseData(loadFixture('space-marines', 'ancient'))

    expect(unitData.tag).toBe('PENDING')
    expect(unitData.id).toBe(47128)
    expect(unitData.slug).toBe('ancient')
    expect(unitData.stats).toEqual({
      movement: 6,
      toughness: 5,
      save: 3,
      invulnerableSave: null,
      wounds: 4,
      leadership: 6,
      objectiveControl: 2,
    })
    expect(unitData.keywords).toEqual(['CHARACTER', 'EXPLOSIVES', 'IMPERIUM', 'INFANTRY', 'TACTICUS'])
    expect(unitData.rawAbilities).toHaveLength(4)
    expect(unitData.rawAbilities.map((a: RawAbility) => a.abilityType)).toEqual(['faction', 'datasheet', 'core', 'datasheet'])
    expect(unitData.abilities).toEqual([])
  })

  it('builds UnitData for a multi-miniature squad (aggressor-squad), picking the common trooper for stats', () => {
    const unitData = preprocessBaseData(loadFixture('space-marines', 'aggressor-squad'))

    expect(unitData.stats).toEqual({
      movement: 5,
      toughness: 6,
      save: 3,
      invulnerableSave: null,
      wounds: 3,
      leadership: 6,
      objectiveControl: 1,
    })
    expect(unitData.keywords).toEqual(['GRAVIS', 'IMPERIUM', 'INFANTRY'])
    expect(unitData.rawAbilities).toHaveLength(2)

    const wargearNames = unitData.wargear.map((w: WargearEntry) => w.wargearItem.name).sort()
    expect(wargearNames).toEqual([
      'Auto Boltstorm Gauntlets',
      'Flamestorm Gauntlets',
      'Fragstorm Grenade Launcher',
      'Twin Power Fists',
    ])

    const flamestorm = unitData.wargear.find((w: WargearEntry) => w.wargearItem.name === 'Flamestorm Gauntlets')!
    expect(flamestorm.wargearItem.count).toBe(1)
    const rangedProfile = flamestorm.wargearItem.profiles.find((p: WeaponProfileData) => p.name === 'Ranged')!
    expect(rangedProfile.abilities).toEqual([
      { id: 3452, name: 'BLAST', value: '2' },
      { id: 3364, name: 'TORRENT', value: null },
      { id: 3480, name: 'TWIN-LINKED', value: null },
    ])

    const fragstorm = unitData.wargear.find((w: WargearEntry) => w.wargearItem.name === 'Fragstorm Grenade Launcher')!
    expect(fragstorm.wargearItem.profiles[0].abilities).toEqual([{ id: 3443, name: 'BLAST', value: '1' }])
  })
})

describe('extractDatasheetContext', () => {
  it('extracts per-miniature rows, costs, composition text, and led-by/supported-by for aggressor-squad', () => {
    const context = extractDatasheetContext(loadFixture('space-marines', 'aggressor-squad'))

    expect(context.miniatures.map((m) => m.name)).toEqual(['Aggressor Sergeant', 'Aggressor'])
    expect(context.miniatures[0].baseSize).toBe('40mm')
    expect(context.miniatures[0].stats.wounds).toBe(3)

    expect(context.costs).toEqual([
      { models: 3, points: 90 },
      { models: 6, points: 180 },
    ])

    expect(context.ledBy.sort()).toEqual(
      ['Captain in Gravis Armour', 'Iron Father Feirros', 'Marneus Calgar', 'Tor Garadon'].sort(),
    )
    expect(context.supportedBy).toEqual(['Apothecary Biologis'])
  })

  it('returns an empty ledBy/supportedBy for a unit nothing attaches to (ancient)', () => {
    const context = extractDatasheetContext(loadFixture('space-marines', 'ancient'))

    expect(context.ledBy).toEqual([])
    expect(context.supportedBy).toEqual([])
    expect(context.costs).toEqual([{ models: 1, points: 40 }])
    expect(context.unitComposition).toContain('1 Ancient model')
  })

  it('omits compositions/ledBy gracefully when BaseData has none', () => {
    const sparse: BaseData = {
      id: 1,
      slug: 'sparse-unit',
      name: 'Sparse Unit',
      abilities: [],
      miniatures: [
        {
          id: 1,
          name: 'Sparse Unit',
          stats: { movement: '6"', toughness: '4', save: '3+', wounds: '2', leadership: '7+', objectiveControl: '1' },
          keywords: [],
          defaultWargear: [],
          wargear: [],
        },
      ],
    }

    const context = extractDatasheetContext(sparse)

    expect(context.costs).toEqual([])
    expect(context.ledBy).toEqual([])
    expect(context.supportedBy).toEqual([])
    expect(context.unitComposition).toBeUndefined()
  })
})
