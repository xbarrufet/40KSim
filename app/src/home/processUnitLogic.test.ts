import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { ArmyListEntry, RawAbility, Rule, WargearEntry } from '../data/schema'
import { getUnitWargear, type BaseData } from '../data/preprocessBaseData'
import {
  buildOtherAbility,
  buildStructuredAbilities,
  dedupeAbilitiesByName,
  matchLoadoutWargear,
  reconcileRawAbilities,
  resolveAttachedEntry,
  splitWeaponProfiles,
  type LoadoutToken,
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

  it('builds an OTHER ability without a type field', () => {
    const raw: RawAbility = { name: 'Support', text: '-', abilityType: 'core' }
    const result = buildOtherAbility(raw)
    expect(result).not.toHaveProperty('type')
  })
})

describe('reconcileRawAbilities', () => {
  const reviewedAbilities = [{ name: 'Already reviewed', rule: BASE_RULE }]
  const pendingRawAbilities: RawAbility[] = [{ name: 'Not yet reviewed', text: '...', abilityType: 'datasheet' }]

  it('appends a newly-appeared live ability to the pending queue', () => {
    const liveRawAbilities: RawAbility[] = [
      { name: 'Not yet reviewed', text: '...', abilityType: 'datasheet' },
      { name: 'Brand New Ability', text: 'Something new.', abilityType: 'datasheet' },
    ]

    const result = reconcileRawAbilities(reviewedAbilities, pendingRawAbilities, liveRawAbilities)

    expect(result).toEqual([
      { name: 'Not yet reviewed', text: '...', abilityType: 'datasheet' },
      { name: 'Brand New Ability', text: 'Something new.', abilityType: 'datasheet' },
    ])
  })

  it('does not duplicate or discard an already-reviewed ability', () => {
    const liveRawAbilities: RawAbility[] = [{ name: 'Already reviewed', text: '...', abilityType: 'datasheet' }]

    const result = reconcileRawAbilities(reviewedAbilities, [], liveRawAbilities)

    expect(result).toEqual([])
  })

  it('does not duplicate an ability already sitting in the pending queue', () => {
    const liveRawAbilities: RawAbility[] = [{ name: 'Not yet reviewed', text: 'refreshed text', abilityType: 'datasheet' }]

    const result = reconcileRawAbilities([], pendingRawAbilities, liveRawAbilities)

    expect(result).toEqual(pendingRawAbilities)
  })
})

function sampleEntry(overrides: Partial<ArmyListEntry> = {}): ArmyListEntry {
  return {
    category: 'BATTLELINE',
    unitName: 'Heavy Intercessor Squad',
    matchedUnitSlug: 'heavy-intercessor-squad',
    matchedFactionSlug: 'imperial-fists',
    unitStatus: 'matched',
    rawWargearText: '',
    wargearTokens: [],
    ...overrides,
  }
}

describe('dedupeAbilitiesByName', () => {
  it('keeps the first occurrence and drops a later ability sharing its name', () => {
    const first: RawAbility = { name: 'Combat Doctrines', text: 'Squad version', abilityType: 'faction' }
    const second: RawAbility = { name: 'Combat Doctrines', text: 'Leader version', abilityType: 'faction' }
    const unique: RawAbility = { name: 'Rites of Battle', text: '...', abilityType: 'datasheet' }

    expect(dedupeAbilitiesByName([first, second, unique])).toEqual([first, unique])
  })

  it('returns an empty array unchanged', () => {
    expect(dedupeAbilitiesByName([])).toEqual([])
  })
})

describe('resolveAttachedEntry', () => {
  it('resolves a "Led by" attachment to the named character\'s own list entry', () => {
    const squad = sampleEntry({ unitName: 'Heavy Intercessor Squad', attachmentText: 'Led by Tor Garadon' })
    const leader = sampleEntry({ unitName: 'Tor Garadon', attachmentText: 'Attached to Heavy Intercessor Squad' })

    expect(resolveAttachedEntry(squad, [squad, leader])).toBe(leader)
  })

  it('resolves a "Supported by" attachment case-insensitively', () => {
    const squad = sampleEntry({ unitName: 'Aggressor Squad', attachmentText: 'Supported by apothecary biologis' })
    const support = sampleEntry({ unitName: 'Apothecary Biologis' })

    expect(resolveAttachedEntry(squad, [squad, support])).toBe(support)
  })

  it('returns undefined when the entry has no attachment text', () => {
    const squad = sampleEntry()
    expect(resolveAttachedEntry(squad, [squad])).toBeUndefined()
  })

  it('returns undefined for an "Attached to" entry (a character pointing at its own squad, not a squad\'s leader/support)', () => {
    const leader = sampleEntry({ unitName: 'Tor Garadon', attachmentText: 'Attached to Heavy Intercessor Squad' })
    const squad = sampleEntry({ unitName: 'Heavy Intercessor Squad' })

    expect(resolveAttachedEntry(leader, [leader, squad])).toBeUndefined()
  })

  it('returns undefined when the named character has no entry of its own in the list', () => {
    const squad = sampleEntry({ attachmentText: 'Led by Nobody Here' })
    expect(resolveAttachedEntry(squad, [squad])).toBeUndefined()
  })
})

describe('matchLoadoutWargear', () => {
  const boltPistol: WargearEntry = {
    wargearItem: { id: 1, name: 'Bolt Pistol', wargearType: 'weapon', count: 1, profiles: [] },
  }
  const chainsword: WargearEntry = {
    wargearItem: { id: 2, name: 'Chainsword', wargearType: 'weapon', count: 1, profiles: [] },
  }
  const plasmaPistol: WargearEntry = {
    wargearItem: {
      id: 3,
      name: 'Plasma Pistol',
      wargearType: 'weapon',
      count: 1,
      profiles: [
        { id: 31, name: 'Plasma Pistol', type: 'ranged', range: '12"', attacks: '1', ballisticSkill: '3+', weaponSkill: null, strength: '7', armourPenetration: '-2', damage: '1', abilities: [] },
        { id: 32, name: 'Supercharge', type: 'ranged', range: '12"', attacks: '1', ballisticSkill: '3+', weaponSkill: null, strength: '8', armourPenetration: '-3', damage: '2', abilities: [] },
      ],
    },
  }
  const wargear = [boltPistol, chainsword, plasmaPistol]

  it('keeps an entry whose wargear item name matches a token, dropping the rest', () => {
    const { matched, unmatchedTokenNames } = matchLoadoutWargear([{ name: 'Bolt Pistol', count: 5 }], wargear)
    expect(matched).toEqual([boltPistol])
    expect(unmatchedTokenNames).toEqual([])
  })

  it('keeps an entry whose profile name (not its item name) matches a token', () => {
    const { matched, unmatchedTokenNames } = matchLoadoutWargear([{ name: 'Supercharge', count: 1 }], wargear)
    expect(matched).toEqual([plasmaPistol])
    expect(unmatchedTokenNames).toEqual([])
  })

  it('returns a token as unmatched when no item or profile name matches it', () => {
    const { matched, unmatchedTokenNames } = matchLoadoutWargear([{ name: 'Thunder Hammer', count: 1 }], wargear)
    expect(matched).toEqual([])
    expect(unmatchedTokenNames).toEqual(['Thunder Hammer'])
  })

  it('matches case-insensitively and separates matched from unmatched tokens in one call', () => {
    const { matched, unmatchedTokenNames } = matchLoadoutWargear(
      [{ name: 'bolt pistol', count: 5 }, { name: 'Grenade Launcher', count: 1 }, { name: 'chainsword', count: 5 }],
      wargear,
    )
    expect(matched).toEqual([boltPistol, chainsword])
    expect(unmatchedTokenNames).toEqual(['Grenade Launcher'])
  })

  it('records the matching token\'s count per matched wargear item, keyed by wargearItem.id', () => {
    const { modelCounts } = matchLoadoutWargear(
      [{ name: 'bolt pistol', count: 10 }, { name: 'chainsword', count: 2 }],
      wargear,
    )
    expect(modelCounts.get(boltPistol.wargearItem.id)).toBe(10)
    expect(modelCounts.get(chainsword.wargearItem.id)).toBe(2)
    expect(modelCounts.has(plasmaPistol.wargearItem.id)).toBe(false)
  })

  it('defaults to a count of 1 when a matching token has no count (e.g. a list saved before counts were tracked)', () => {
    const legacyToken = { name: 'Bolt Pistol' } as unknown as LoadoutToken
    const { modelCounts } = matchLoadoutWargear([legacyToken], wargear)
    expect(modelCounts.get(boltPistol.wargearItem.id)).toBe(1)
  })
})

describe('splitWeaponProfiles', () => {
  it('splits aggressor-squad wargear into ranged/melee tables with ability chips and sub-profile labels', () => {
    const wargear = getUnitWargear(loadFixture('aggressor-squad'))
    const { ranged, melee } = splitWeaponProfiles(wargear)

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
    const wargear = getUnitWargear(loadFixture('ancient'))
    const { melee } = splitWeaponProfiles(wargear)
    const ceramiteFists = melee.find((row) => row.label === 'Ceramite Fists')
    expect(ceramiteFists).toBeDefined()
  })
})
