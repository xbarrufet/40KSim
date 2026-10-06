import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { RawAbility, Rule, UnitDataStats, WargearEntry } from '../data/schema'
import { preprocessBaseData, type BaseData } from '../data/preprocessBaseData'
import {
  applyResync,
  buildOtherAbility,
  buildStructuredAbilities,
  splitWeaponProfiles,
  type StructuringRow,
} from './processUnitLogic'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')

function loadFixture(unitSlug: string): BaseData {
  const path = resolve(repoRoot, 'data', 'space-marines', 'BaseData', `${unitSlug}.json`)
  return JSON.parse(readFileSync(path, 'utf-8'))
}

const BASE_RULE: Rule = { trigger: 'ALWAYS', type: 'unitStatsModifier', appliedTo: 'SelfModel', stat: 'ObjectiveControl', value: '' }

describe('buildStructuredAbilities', () => {
  it('fans out a single raw ability (Finest Hour) into two independent structured abilities', () => {
    const rows: StructuringRow[] = [
      {
        name: 'Finest Hour (+3 Attacks)',
        type: 'Always',
        rule: {
          trigger: 'Is this the Fight phase and this unit selected to fight?',
          appliedTo: 'SelfModel',
          type: 'weaponStatsModifier',
          weaponTarget: 'ALL',
          stat: 'Attacks',
          value: '+3',
        },
      },
      {
        name: 'Finest Hour (Devastating Wounds)',
        type: 'Always',
        rule: {
          trigger: 'Is this the Fight phase and this unit selected to fight?',
          appliedTo: 'SelfModel',
          type: 'addAttribute',
          weaponTarget: 'ALL',
          attribute: 'DEVASTATING WOUNDS',
          value: null,
        },
      },
    ]

    const result = buildStructuredAbilities(rows)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      type: 'Always',
      name: 'Finest Hour (+3 Attacks)',
      rule: {
        trigger: 'Is this the Fight phase and this unit selected to fight?',
        appliedTo: 'SelfModel',
        type: 'weaponStatsModifier',
        weaponTarget: 'ALL',
        stat: 'Attacks',
        value: '+3',
      },
    })
    expect(result[1]).toEqual({
      type: 'Always',
      name: 'Finest Hour (Devastating Wounds)',
      rule: {
        trigger: 'Is this the Fight phase and this unit selected to fight?',
        appliedTo: 'SelfModel',
        type: 'addAttribute',
        weaponTarget: 'ALL',
        attribute: 'DEVASTATING WOUNDS',
        value: null,
      },
    })
  })

  it('returns a single entry for a single-effect row', () => {
    const result = buildStructuredAbilities([{ name: 'Honour of the Company', type: 'Always', rule: { ...BASE_RULE, stat: 'ObjectiveControl', value: '+1' } }])
    expect(result).toHaveLength(1)
  })
})

describe('buildOtherAbility', () => {
  it('preserves the raw text verbatim with no rule attached', () => {
    const raw: RawAbility = {
      name: 'Raise the Banner',
      text: 'At the end of your Movement phase, if this unit is controlling an objective, that objective is secured.',
      abilityType: 'datasheet',
    }

    const result = buildOtherAbility(raw)

    expect(result).toEqual({
      type: 'Always',
      name: 'Raise the Banner',
      category: 'OTHER',
      text: raw.text,
    })
    expect(result).not.toHaveProperty('rule')
  })

  it('uses the provided ability context instead of the Always default', () => {
    const raw: RawAbility = { name: 'Support', text: '-', abilityType: 'core' }
    const result = buildOtherAbility(raw, 'AsLeader')
    expect(result.type).toBe('AsLeader')
  })
})

describe('applyResync', () => {
  const stats: UnitDataStats = { movement: 6, toughness: 4, save: 3, invulnerableSave: null, wounds: 3, leadership: 7, objectiveControl: 1 }
  const wargear: WargearEntry[] = [{ wargearItem: { id: 1, name: 'Bolt Rifle', wargearType: 'weapon', count: 1, profiles: [] } }]

  it('replaces stats/keywords/wargear while leaving reviewed and raw abilities untouched', () => {
    const draft = {
      stats: { ...stats, movement: 5 },
      keywords: ['INFANTRY'],
      wargear: [],
      abilities: [{ type: 'Always' as const, name: 'Already reviewed', rule: BASE_RULE }],
      rawAbilities: [{ name: 'Not yet reviewed', text: '...', abilityType: 'datasheet' }],
    }

    const refreshed = { stats, keywords: ['INFANTRY', 'CHARACTER'], wargear }
    const result = applyResync(draft, refreshed)

    expect(result.stats).toEqual(stats)
    expect(result.keywords).toEqual(['INFANTRY', 'CHARACTER'])
    expect(result.wargear).toEqual(wargear)
    expect(result.abilities).toBe(draft.abilities)
    expect(result.rawAbilities).toBe(draft.rawAbilities)
  })
})

describe('splitWeaponProfiles', () => {
  it('splits aggressor-squad wargear into ranged/melee tables with ability chips and sub-profile labels', () => {
    const unitData = preprocessBaseData(loadFixture('aggressor-squad'))
    const { ranged, melee } = splitWeaponProfiles(unitData.wargear)

    const rangedLabels = ranged.map((row) => row.label).sort()
    expect(rangedLabels).toEqual([
      'Auto Boltstorm Gauntlets',
      'Flamestorm Gauntlets (Close Quarters)',
      'Flamestorm Gauntlets (Ranged)',
      'Fragstorm Grenade Launcher',
    ])

    const meleeLabels = melee.map((row) => row.label)
    expect(meleeLabels).toEqual(['Twin Power Fists'])

    const flamestormRanged = ranged.find((row) => row.label === 'Flamestorm Gauntlets (Ranged)')!
    expect(flamestormRanged.profile.abilities).toEqual([
      { id: 3452, name: 'BLAST', value: '2' },
      { id: 3364, name: 'TORRENT', value: null },
      { id: 3480, name: 'TWIN-LINKED', value: null },
    ])
  })

  it('uses the wargear item name as the label when there is only one, identically-named profile', () => {
    const unitData = preprocessBaseData(loadFixture('ancient'))
    const { melee } = splitWeaponProfiles(unitData.wargear)
    const ceramiteFists = melee.find((row) => row.label === 'Ceramite Fists')
    expect(ceramiteFists).toBeDefined()
  })
})
